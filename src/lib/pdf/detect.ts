/**
 * File-type detection for the universal converter.
 *
 * Extensions lie — a WhatsApp download is `IMG-20240612.jpg` whatever it
 * really holds, and a form's "export" is as likely to be `.xls` containing
 * HTML as a real spreadsheet. So the first four kilobytes decide the type,
 * and the name is only consulted to separate things that share a signature:
 * plain text, Markdown and CSV are all just text on disk.
 */

export type Kind =
  | "pdf"
  | "image"
  | "svg"
  | "psd"
  | "tiff"
  | "docx"
  | "xlsx"
  | "pptx"
  | "odt"
  | "ods"
  | "odp"
  | "epub"
  | "iwork"
  | "rtf"
  | "eml"
  | "html"
  | "markdown"
  | "csv"
  | "text"
  | "unsupported";

export type Detected = {
  kind: Kind;
  /** What to show the visitor — "Word document", "PNG image". */
  label: string;
  /** Set when the file is recognised but cannot be converted here. */
  reason?: string;
};

const HEAD = 4096;

const ascii = (b: Uint8Array, at: number, text: string) => {
  for (let i = 0; i < text.length; i++)
    if (b[at + i] !== text.charCodeAt(i)) return false;
  return true;
};

const find = (b: Uint8Array, text: string, within: number) => {
  for (let i = 0; i <= Math.min(b.length, within) - text.length; i++)
    if (ascii(b, i, text)) return i;
  return -1;
};

const ext = (name: string) =>
  (name.match(/\.([^.]+)$/)?.[1] ?? "").toLowerCase();

/** Zip containers all start `PK`, so the member names decide what it is. */
async function insideZip(file: File): Promise<Detected> {
  const JSZip = (await import("jszip")).default;
  let names: string[];
  try {
    names = Object.keys((await JSZip.loadAsync(file)).files);
  } catch {
    return {
      kind: "unsupported",
      label: "archive",
      reason: "This archive could not be opened.",
    };
  }
  const has = (p: string) => names.some((n) => n.startsWith(p));

  if (has("word/")) return { kind: "docx", label: "Word document" };
  if (has("xl/")) return { kind: "xlsx", label: "Excel spreadsheet" };
  if (has("ppt/")) return { kind: "pptx", label: "PowerPoint deck" };

  /* An EPUB is a zip whose spine is named in a manifest; the container is
     the reliable marker, since the content folder is named by the publisher. */
  if (names.includes("META-INF/container.xml") || has("OEBPS") || has("EPUB"))
    return { kind: "epub", label: "EPUB book" };

  /* Pages, Numbers and Keynote store their own format, but every one of them
     also carries the preview the Finder shows — which is a real PDF. */
  if (has("Index/") || has("QuickLook/") || names.includes("preview.jpg")) {
    const app =
      { pages: "Pages document", numbers: "Numbers spreadsheet", key: "Keynote deck" }[
        ext(file.name)
      ] ?? "iWork document";
    if (names.some((n) => /^(QuickLook\/Preview\.pdf|preview\.jpg)$/.test(n)))
      return { kind: "iwork", label: app };
    return {
      kind: "unsupported",
      label: app,
      reason:
        "This file was saved without the preview this tool reads. Open it and export to PDF, or re-save it with previews turned on.",
    };
  }

  if (names.includes("content.xml")) {
    const type = await zipText(names, file);
    if (type === "text") return { kind: "odt", label: "OpenDocument text" };
    if (type === "spreadsheet") return { kind: "ods", label: "OpenDocument spreadsheet" };
    if (type === "presentation") return { kind: "odp", label: "OpenDocument slides" };
    return { kind: "odt", label: "OpenDocument file" };
  }

  return {
    kind: "unsupported",
    label: "zip archive",
    reason:
      "A zip archive holds files rather than being one. Unzip it and add the contents.",
  };
}

/** The `mimetype` member says which OpenDocument flavour a zip is. */
async function zipText(names: string[], file: File): Promise<string> {
  if (!names.includes("mimetype")) return "";
  const JSZip = (await import("jszip")).default;
  const mime = await (await JSZip.loadAsync(file)).file("mimetype")?.async("string");
  return mime?.match(/opendocument\.(\w+)/)?.[1] ?? "";
}

export async function sniff(file: File): Promise<Detected> {
  const head = new Uint8Array(await file.slice(0, HEAD).arrayBuffer());
  const e = ext(file.name);

  /* ------------------------------------------------------------ binary */

  if (ascii(head, 0, "8BPS")) return { kind: "psd", label: "Photoshop file" };

  /* Zip containers are tested first. A Pages file stores its PDF preview
     uncompressed, which puts `%PDF` inside the first kilobyte of the archive
     — so scanning for that signature before ruling out a zip would identify
     half of Apple's formats as plain PDFs. */
  if (ascii(head, 0, "PK") && (head[2] === 3 || head[2] === 5 || head[2] === 7))
    return insideZip(file);

  /* A PDF is allowed a little junk before its header, and plenty of real
     files in the wild have some. */
  if (find(head, "%PDF-", 1024) >= 0)
    return {
      kind: "pdf",
      /* Illustrator saves PDF-compatible artwork, so an .ai file usually is
         a PDF wearing another extension — and converts with no work at all. */
      label: e === "ai" ? "Illustrator artwork" : "PDF",
    };

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff)
    return { kind: "image", label: "JPEG image" };
  if (head[0] === 0x89 && ascii(head, 1, "PNG"))
    return { kind: "image", label: "PNG image" };
  if (ascii(head, 0, "GIF8")) return { kind: "image", label: "GIF image" };
  if (ascii(head, 0, "RIFF") && ascii(head, 8, "WEBP"))
    return { kind: "image", label: "WebP image" };
  if (ascii(head, 0, "BM")) return { kind: "image", label: "BMP image" };
  if (ascii(head, 4, "ftyp")) {
    const brand = String.fromCharCode(...head.slice(8, 12));
    if (/^(avif|avis)/.test(brand))
      return { kind: "image", label: "AVIF image" };
    if (/^(heic|heix|hevc|heim|heis|mif1|msf1)/.test(brand))
      return { kind: "image", label: "HEIC photo" };
    return {
      kind: "unsupported",
      label: "video",
      reason: "A video has no fixed page to put on paper.",
    };
  }
  if (
    (head[0] === 0x49 && head[1] === 0x49 && head[2] === 0x2a) ||
    (head[0] === 0x4d && head[1] === 0x4d && head[2] === 0x00)
  )
    return { kind: "tiff", label: "TIFF image" };
  if (
    head[0] === 0xd0 &&
    head[1] === 0xcf &&
    head[2] === 0x11 &&
    head[3] === 0xe0
  )
    return {
      kind: "unsupported",
      label: "legacy Office file",
      reason:
        "This is the pre-2007 Office format (.doc, .xls). Open it and save as .docx or .xlsx, and it will convert.",
    };
  if (ascii(head, 0, "{\\rtf")) return { kind: "rtf", label: "RTF document" };

  /* -------------------------------------------------------------- text */

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(head);
  } catch {
    return {
      kind: "unsupported",
      label: "unrecognised file",
      reason:
        "This does not look like a document, an image, or anything else this tool can read.",
    };
  }
  /* A NUL inside the first block means binary, whatever it decoded to. */
  if (text.includes("\u0000"))
    return {
      kind: "unsupported",
      label: "binary file",
      reason: "This file is not text or a document.",
    };

  const start = text.replace(/^\uFEFF/, "").trimStart();
  const lower = start.toLowerCase();

  if (lower.startsWith("%!ps"))
    return {
      kind: "unsupported",
      label: e === "ai" ? "legacy Illustrator artwork" : "PostScript file",
      reason:
        "This is PostScript, which needs an interpreter no browser has. Open it in Illustrator and save with \u201cCreate PDF Compatible File\u201d ticked, and it will convert.",
    };
  /* An email is text with a header block; the blank line ends it. */
  if (
    e === "eml" ||
    /^(from|to|subject|date|received|message-id|mime-version):/im.test(
      start.slice(0, 400),
    )
  )
    return { kind: "eml", label: "email message" };
  if (
    lower.startsWith("<svg") ||
    (lower.startsWith("<?xml") && lower.includes("<svg"))
  )
    return { kind: "svg", label: "SVG image" };
  if (
    lower.startsWith("<!doctype html") ||
    lower.startsWith("<html") ||
    e === "html" ||
    e === "htm"
  )
    return { kind: "html", label: "web page" };
  if (e === "md" || e === "markdown" || e === "mdx")
    return { kind: "markdown", label: "Markdown" };
  if (e === "csv" || e === "tsv") return { kind: "csv", label: "CSV data" };
  /* Unnamed text that reads like a table is treated as one. */
  if (!e && looksTabular(start)) return { kind: "csv", label: "CSV data" };
  if (looksMarkdown(start)) return { kind: "markdown", label: "Markdown" };
  return { kind: "text", label: e ? `${e.toUpperCase()} text` : "text file" };
}

function looksTabular(text: string) {
  const lines = text
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 5);
  if (lines.length < 2) return false;
  const counts = lines.map((l) => (l.match(/,/g) ?? []).length);
  return counts[0] >= 1 && counts.every((c) => c === counts[0]);
}

function looksMarkdown(text: string) {
  return /^#{1,6} \S/m.test(text) || /^[-*] \S/m.test(text) || /^```/m.test(text);
}
