/**
 * LogoMark — the Inbox Copilot brand logo (Robot Mascot).
 * Inline SVG so it renders correctly inside the Shadow DOM without
 * needing an external URL fetch (no chrome.runtime.getURL required).
 */
interface LogoMarkProps {
  /** Pixel size of the SVG container */
  size?: number
  className?: string
  /** Color of the SVG lines, defaults to white since it's usually on a colored background */
  color?: string
}

export function LogoMark({ size = 24, className = '', color = 'white' }: LogoMarkProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      width={size} 
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path fill="none" stroke={color} strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" d="M 96 200 A 32 32 0 0 0 64 232 L 64 424 A 32 32 0 0 0 96 456 L 416 456 A 32 32 0 0 0 448 424 L 448 232 A 32 32 0 0 0 416 200" />
      <path fill="none" stroke={color} strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" d="M 96 200 L 256 340 L 416 200" />
      <path fill="none" stroke={color} strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" d="M 144 144 A 24 24 0 0 0 144 192" />
      <path fill="none" stroke={color} strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" d="M 368 144 A 24 24 0 0 1 368 192" />
      <rect fill="none" stroke={color} strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" x="144" y="96" width="224" height="152" rx="40" />
      <path fill="none" stroke={color} strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" d="M 256 96 L 256 64" />
      <circle fill={color} cx="256" cy="44" r="20" />
      <path fill="none" stroke={color} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" d="M 192 164 Q 212 140 232 164" />
      <path fill="none" stroke={color} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" d="M 280 164 Q 300 140 320 164" />
      <path fill="none" stroke={color} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" d="M 230 196 Q 256 226 282 196" />
    </svg>
  )
}
