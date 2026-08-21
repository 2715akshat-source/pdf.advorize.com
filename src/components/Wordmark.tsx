/**
 * The Advorize wordmark.
 *
 * The supplied artwork is a white wordmark on solid black, which would sit in
 * a black box on the light theme. Rather than ship two files, the image is
 * used as a CSS mask and filled with `currentColor` — the black becomes
 * transparent, the letterforms take whatever colour the parent text is, and
 * one asset covers both themes.
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Advorize"
      className={className}
      style={{
        display: "block",
        aspectRatio: "900 / 270",
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/wordmark.png)",
        maskImage: "url(/wordmark.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
      }}
    />
  );
}
