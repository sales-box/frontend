/**
 * Pulls the text out of a spreadsheet so the address parser can scan it.
 *
 * Why hand-rolled: .xlsx (and .ods, and Numbers) is a ZIP of XML, and Chrome
 * ships DecompressionStream, so reading one needs no library at all. The usual
 * choice, SheetJS, is ~400 KB in the bundle and the copy published to npm lags
 * the maintained one — a lot of weight and a supply-chain question for a job
 * that is "give me every string in this file".
 *
 * We deliberately do NOT reconstruct the grid: no rows, no columns, no types.
 * The caller only wants the tokens that look like email addresses, and it
 * already knows how to find those in free text. Skipping cell reconstruction
 * also means column order, header wording and merged cells cannot break it.
 */

/** Files inside the archive worth reading, by format. */
const WANTED =
  /^(xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml|content\.xml)$/;

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;

/** Thrown when the bytes are not a readable archive. The caller turns this into UI copy. */
export class NotASpreadsheetError extends Error {}

/** Finds the End Of Central Directory record, which may sit behind a comment. */
function findEocd(view: DataView): number {
  // 22 bytes minimum, plus a comment of at most 0xffff.
  const earliest = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let i = view.byteLength - 22; i >= earliest; i--) {
    if (view.getUint32(i, true) === SIG_EOCD) return i;
  }
  throw new NotASpreadsheetError("no end-of-central-directory record");
}

async function inflate(bytes: Uint8Array, method: number): Promise<string> {
  if (method === 0) return new TextDecoder().decode(bytes); // stored
  if (method !== 8) throw new NotASpreadsheetError(`compression method ${method}`);
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

/** Strips tags and decodes the five XML entities. Whitespace keeps tokens apart. */
function xmlToText(xml: string): string {
  return xml
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export async function extractSpreadsheetText(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  const eocd = findEocd(view);
  const entryCount = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);

  const parts: string[] = [];

  for (let n = 0; n < entryCount; n++) {
    if (cursor + 46 > view.byteLength) break;
    if (view.getUint32(cursor, true) !== SIG_CENTRAL) break;

    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(
      bytes.subarray(cursor + 46, cursor + 46 + nameLen),
    );

    if (WANTED.test(name)) {
      // The local header repeats the name/extra lengths, and its extra field
      // can differ from the central one — always read them from the local copy.
      const localNameLen = view.getUint16(localOffset + 26, true);
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const chunk = bytes.subarray(dataStart, dataStart + compressedSize);
      parts.push(xmlToText(await inflate(chunk, method)));
    }

    cursor += 46 + nameLen + extraLen + commentLen;
  }

  if (parts.length === 0) {
    throw new NotASpreadsheetError("archive holds no sheet data");
  }
  return parts.join("\n");
}
