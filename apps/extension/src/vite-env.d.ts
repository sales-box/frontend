/// <reference types="vite/client" />

// Allow ?inline CSS imports — used by content.tsx to inject bundled styles
// into the shadow DOM without an external <link> tag.
declare module '*.css?inline' {
  const styles: string
  export default styles
}
