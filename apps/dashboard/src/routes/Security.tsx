import { LegalLayout, type LegalSection } from "../components/LegalLayout"

const sections: LegalSection[] = [
  {
    id: "tenant-isolation",
    title: "Multi-tenant data isolation",
    body: <p>Every company's data — knowledge base documents, client records, conversation history, and every AI query — is strictly isolated by company at every layer, with no exceptions. One company's employees cannot see another company's data, even while both are actively using the platform at the same time.</p>,
  },
  {
    id: "access-control",
    title: "Access control lifecycle",
    body: (
      <>
        <p>Access follows a three-step model: a company administrator <strong>grants</strong> a Sales Engineer's email onto their company's approved user list; the system <strong>verifies</strong> that email against the list the moment that person attempts to connect their Gmail account, rejecting the connection outright if it isn't listed — even if Google's own consent screen was approved; and when an administrator <strong>revokes</strong> access, we immediately invalidate that person's active Google authorization token, not just block future connections. A leftover valid token would otherwise still grant real access, so revocation is treated as a token-invalidation event, not a permission flag.</p>
      </>
    ),
  },
  {
    id: "read-only-crm",
    title: "Read-only CRM access, by design",
    body: (
      <>
        <p>Every CRM integration (HubSpot today, Zoho planned) is read-only. The system never writes to your CRM automatically — any update a Sales Engineer wants to make is entered by them, manually. This is a deliberate design decision, not a current limitation: it keeps a human accountable for every change made to your CRM data, and read-only access is significantly easier for a customer's security team to approve during procurement than write access would be.</p>
      </>
    ),
  },
  {
    id: "knowledge-separation",
    title: "Strict separation between product knowledge and client data",
    body: (
      <>
        <p>The AI draws on two categories of information that are kept deliberately isolated from each other: your company's official, administrator-curated knowledge base (the only source used to answer questions with high confidence), and content extracted from a specific client's own email attachments, which is scoped to that client only and is never surfaced as general product information in a reply to a different client.</p>
        <p>This exists specifically to prevent something disclosed privately to one client — a custom discount, a one-off commitment — from leaking into a reply sent to an unrelated client.</p>
      </>
    ),
  },
  {
    id: "hallucination-gate",
    title: "A dedicated safety check against fabricated claims",
    body: <p>Before any AI-drafted reply reaches a Sales Engineer, it's checked against your knowledge base and client history. If it contains a claim that isn't backed by any real source, that draft is not shown as a suggestion at all — it's routed straight to full manual handling, regardless of how confident the underlying score was. We treat "not enough information" and "confidently stating something untrue" as two different problems, and handle the second one as a hard stop, not a lower score.</p>,
  },
  {
    id: "human-in-the-loop",
    title: "Humans stay in control",
    body: <p>No reply is ever sent automatically, at any AI confidence level. Every message is reviewed by a Sales Engineer and sent from their own Gmail account before a client ever sees it.</p>,
  },
  {
    id: "prompt-injection",
    title: "Defense against malicious email content",
    body: <p>Because the product reads real inbound emails and attachments — content we don't control — we treat all of it as untrusted input to the AI system, with automated screening for attempts to manipulate the AI's behavior through instructions hidden in an incoming email or attachment.</p>,
  },
  {
    id: "auth",
    title: "Authentication",
    body: <p>Sales Engineers connect their Gmail account through Google's standard OAuth flow — we never see or store your Google password. Each connection is individual and personal; the product does not support a shared team inbox or shared credentials.</p>,
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    body: <p>Our service is hosted on secure cloud infrastructure provided by Amazon Web Services (AWS) and Google Cloud Platform (GCP). All data is encrypted in transit using TLS 1.3 (or TLS 1.2 at a minimum) and at rest using AES-256 encryption.</p>,
  },
  {
    id: "compliance",
    title: "Compliance",
    body: <p>We are committed to maintaining the highest security standards and are actively working toward SOC 2 alignment and compliance to formally certify our security controls and processes.</p>,
  },
  {
    id: "known-limitations",
    title: "Ongoing security work",
    body: <p>We continually assess and improve our security posture, particularly regarding the browser extension's environment. We employ standard web sandbox technologies and strict tenant isolation mechanisms to ensure that the extension operates securely and prevents any cross-company data leakage or unauthorized access.</p>,
  },
  {
    id: "report",
    title: "Report a vulnerability",
    body: <p>Found a security issue? Email us at salesbox@support.com.</p>,
  },
]

export function Security() {
  return <LegalLayout pageTitle="Security" lastUpdated="July 18, 2026" sections={sections} />
}
