/**
 * The tool registry — one entry per page on the site.
 *
 * This file is the whole site map: routes, form controls, on-page copy, FAQs
 * and internal links all come from here, so adding a tool is one object and
 * nothing else. Titles stay under ~60 characters and descriptions 140–160 so
 * neither gets truncated in the SERP, and no two tools share a description.
 */

export type Field = {
  key: string;
  label: string;
  type: "select" | "text" | "number" | "toggle";
  options?: { value: string; label: string }[];
  default?: string;
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
};

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  /** key into `engines` in lib/pdf/engines.ts */
  engine: string;
  accept: string;
  multiple?: boolean;
  category: "Organise" | "Optimise" | "Convert" | "Edit" | "Secure";
  title: string;
  description: string;
  h1: string;
  intro: string;
  steps: string[];
  faqs: { q: string; a: string }[];
  keywords: string[];
  related: string[];
  action: string;
  fields?: Field[];
  /** Tools whose interface is not the shared file-in / file-out runner. */
  custom?: "editor" | "unwatermark";
  /** Shows what each dropped file was recognised as — for `accept: "*"`. */
  detects?: boolean;
};

const PDF = "application/pdf,.pdf";
const IMG = "image/*";

const PAGES_FIELD = (label: string, placeholder: string, help: string): Field => ({
  key: "pages",
  label,
  type: "text",
  placeholder,
  help,
});

export const tools: Tool[] = [
  {
    slug: "edit-pdf",
    name: "Edit PDF",
    tagline: "Type on a PDF, sign it, highlight it, then download it.",
    engine: "editor",
    accept: PDF,
    category: "Edit",
    custom: "editor",
    action: "Save the edited PDF",
    title:
      "Edit PDF Free — Add Text, Sign and Download",
    description:
      "Edit a PDF free in your browser: type on the page, sign it by hand, highlight and add images, then download. No sign-up, and your file is never uploaded.",
    h1: "Edit a PDF and download it",
    intro:
      "The thing most people actually want from a PDF tool: open the file, add what is missing, and save it. Type anywhere on the page, sign it by hand, highlight a clause, drop in a stamp or a logo — then download a PDF whose original pages are untouched underneath.",
    steps: [
      "Open the PDF you need to change.",
      "Pick a tool — text, freehand drawing, highlighter or image — and work straight on the page.",
      "Save, and download the edited file.",
    ],
    faqs: [
      {
        q: "Can I change the text that is already in the PDF?",
        a: "No — this adds to a page rather than rewriting it. A PDF stores text as positioned glyphs, not as editable paragraphs, so genuine reflow means going back to the source document. Covering a line and typing over it is the practical fix, and it is what most editors do too.",
      },
      {
        q: "How do I sign a document?",
        a: "Choose Draw and sign with your trackpad, mouse or finger — on a phone it is close to signing on paper. If you already have a signature saved as a PNG, use Image instead and drag it into place.",
      },
      {
        q: "Does editing ruin the rest of the file?",
        a: "No. Your additions are written on top of the original pages, so the existing text stays selectable and searchable and the images keep their resolution. Nothing is flattened into a picture.",
      },
      {
        q: "Is my document uploaded while I edit it?",
        a: "Never. The pages are rendered and the file is rewritten entirely inside this tab — which is exactly why a contract or a bank statement is safe to open here. Turn off your Wi-Fi and the editor keeps working.",
      },
    ],
    keywords: [
      "edit pdf",
      "edit pdf online free",
      "add text to pdf",
      "sign pdf online",
      "write on pdf free",
      "pdf editor no sign up",
    ],
    related: ["watermark-pdf", "add-page-numbers", "merge-pdf", "flatten-pdf"],
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    tagline: "Combine any number of PDFs into one file, in the order you choose.",
    engine: "merge",
    accept: PDF,
    multiple: true,
    category: "Organise",
    action: "Merge PDFs",
    title:
      "Merge PDF Free — Combine PDF Files Online",
    description:
      "Merge PDF files into one free, in any order, with no upload and no sign-up. Combine contracts, scans and annexures in your browser and download instantly.",
    h1: "Merge PDF files into one",
    intro:
      "Drop in the documents you want joined, drag them into the order you want, and get a single PDF back. The merge happens inside this tab using your own machine, so even a confidential contract never leaves your computer.",
    steps: [
      "Add two or more PDFs — drag them in together or pick them one at a time.",
      "Drag the cards to set the order the pages should run in.",
      "Press Merge PDFs and save the combined file.",
    ],
    faqs: [
      {
        q: "Is there a limit on how many PDFs I can merge?",
        a: "There is no fixed limit. The practical ceiling is your device's memory, since everything is processed locally — a few hundred megabytes of documents is comfortable on a normal laptop.",
      },
      {
        q: "Do my files get uploaded to a server?",
        a: "No. The merge runs in JavaScript inside your browser tab. Nothing is transmitted, stored or logged, which is why the tool also works with your Wi-Fi switched off.",
      },
      {
        q: "Will merging change the quality of my pages?",
        a: "No. Pages are copied across verbatim, so text stays selectable and images keep their original resolution. The file size of the result is roughly the sum of the inputs.",
      },
    ],
    keywords: [
      "merge pdf",
      "combine pdf files",
      "join pdf online free",
      "merge pdf without upload",
      "pdf merger free",
    ],
    related: ["split-pdf", "organize-pdf", "compress-pdf", "edit-pdf"],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    tagline: "Break one PDF into separate files by page range or every N pages.",
    engine: "split",
    accept: PDF,
    category: "Organise",
    action: "Split PDF",
    title:
      "Split PDF Free — Separate Pages or Ranges",
    description:
      "Split a PDF into single pages or custom page ranges free. Break up a scan holding several documents in your browser — no upload, no watermark, no sign-up.",
    h1: "Split a PDF into separate files",
    intro:
      "Cut one document into several. Either slice it every few pages, or write out the exact ranges you want as separate files — useful when one scan holds a dozen invoices.",
    steps: [
      "Choose the PDF you want to break apart.",
      "Pick fixed chunks (every 1 page, every 5 pages…) or type ranges like 1-3; 4-9; 10-.",
      "Split, and the pieces download together as a zip.",
    ],
    faqs: [
      {
        q: "How do I write the page ranges?",
        a: "Separate each output file with a semicolon and use hyphens inside it: 1-3; 4; 5-last produces three PDFs. An open-ended range like 10- runs to the end of the document.",
      },
      {
        q: "Why do I get a zip file?",
        a: "Because a split usually produces several PDFs, and browsers block multi-file downloads. When the split produces a single file you get that PDF directly instead.",
      },
      {
        q: "Can I split a password-protected PDF?",
        a: "Remove the password first with the unlock tool, then split the result. An encrypted document cannot have its pages read until it is opened.",
      },
    ],
    keywords: [
      "split pdf",
      "separate pdf pages",
      "extract pdf pages online",
      "split pdf by page range",
      "pdf splitter free",
    ],
    related: ["merge-pdf", "extract-pdf-pages", "remove-pages-from-pdf", "organize-pdf"],
    fields: [
      {
        key: "mode",
        label: "Split by",
        type: "select",
        default: "every",
        options: [
          { value: "every", label: "Fixed number of pages" },
          { value: "ranges", label: "Custom page ranges" },
        ],
      },
      {
        key: "every",
        label: "Pages per file",
        type: "number",
        default: "1",
        min: 1,
        help: "1 gives you every page as its own PDF.",
      },
      {
        key: "ranges",
        label: "Ranges",
        type: "text",
        placeholder: "1-3; 4; 5-last",
        help: "One output file per range, separated by semicolons.",
      },
    ],
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    tagline: "Shrink a heavy PDF down to an emailable size.",
    engine: "compress",
    accept: PDF,
    category: "Optimise",
    action: "Compress PDF",
    title:
      "Compress PDF — Reduce Size to 100KB or 1MB",
    description:
      "Compress PDF free to fit a 100KB, 200KB, 500KB or 1MB upload limit. Choose a quality level and shrink scans by up to 90% in your browser, with no upload.",
    h1: "Compress a PDF to a smaller size",
    intro:
      "Portal upload capped at 2 MB? Pick a quality level and this rebuilds every page as an optimised image, which is what makes scanned documents and image-heavy decks drop so sharply.",
    steps: [
      "Add the PDF that is too large.",
      "Choose a quality level — medium is the usual sweet spot for scans.",
      "Compress and download the smaller file.",
    ],
    faqs: [
      {
        q: "How much smaller will my PDF get?",
        a: "Scanned and image-heavy documents typically drop by 60–90%. A PDF that is only text is already efficient, so expect a modest saving there — and in that case try greyscale instead.",
      },
      {
        q: "Will the text still be selectable afterwards?",
        a: "No. Compression re-renders each page as an image, which is what produces the size reduction, so the result is visually identical but no longer searchable. Keep the original if you need the text layer.",
      },
      {
        q: "Which quality level should I choose?",
        a: "Medium for anything being read on screen, high when the document will be printed, low only when you are up against a hard upload limit and legibility is all that matters.",
      },
    ],
    keywords: [
      "compress pdf",
      "reduce pdf file size",
      "compress pdf to 200kb",
      "shrink pdf online free",
      "pdf compressor no upload",
    ],
    related: ["grayscale-pdf", "flatten-pdf", "pdf-to-jpg", "merge-pdf"],
    fields: [
      {
        key: "level",
        label: "Quality",
        type: "select",
        default: "medium",
        options: [
          { value: "low", label: "Low — smallest file" },
          { value: "medium", label: "Medium — recommended" },
          { value: "high", label: "High — best looking" },
        ],
      },
      {
        key: "grayscale",
        label: "Convert to greyscale as well",
        type: "toggle",
        help: "Drops colour for a further saving on scanned paperwork.",
      },
    ],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    tagline: "Turn sideways or upside-down pages the right way up, permanently.",
    engine: "rotate",
    accept: PDF,
    category: "Edit",
    action: "Rotate pages",
    title:
      "Rotate PDF Free — And Save the Rotation",
    description:
      "Rotate PDF pages 90, 180 or 270 degrees and save it permanently, so it stays turned for everyone. Free, no upload, and you can rotate only the pages you name.",
    h1: "Rotate the pages of a PDF",
    intro:
      "Rotating in a PDF reader usually only changes how it looks on your screen. This writes the rotation into the file, so it stays turned for whoever opens it next and however it is printed.",
    steps: [
      "Add the PDF with the sideways pages.",
      "Pick the angle, and name specific pages if only some are wrong.",
      "Rotate and download the corrected file.",
    ],
    faqs: [
      {
        q: "Can I rotate only some of the pages?",
        a: "Yes — leave the page box empty to turn everything, or type something like 2, 5-9 to rotate only those. The rest of the document is untouched.",
      },
      {
        q: "Why did my rotation disappear last time?",
        a: "Most viewers rotate the view, not the document, and forget it when you close the file. This tool writes the rotation into the page objects themselves, so it persists.",
      },
      {
        q: "Does rotating reduce the quality?",
        a: "No. Nothing is re-rendered; only a rotation value on each page is changed, so text, images and file size stay exactly as they were.",
      },
    ],
    keywords: [
      "rotate pdf",
      "rotate pdf and save",
      "turn pdf pages online",
      "rotate pdf 90 degrees free",
    ],
    related: ["organize-pdf", "crop-pdf", "remove-pages-from-pdf", "merge-pdf"],
    fields: [
      {
        key: "angle",
        label: "Rotate by",
        type: "select",
        default: "90",
        options: [
          { value: "90", label: "90° clockwise" },
          { value: "180", label: "180°" },
          { value: "270", label: "90° anticlockwise" },
        ],
      },
      PAGES_FIELD(
        "Pages (optional)",
        "e.g. 2, 5-9",
        "Leave empty to rotate every page.",
      ),
    ],
  },
  {
    slug: "remove-pages-from-pdf",
    name: "Delete PDF pages",
    tagline: "Strip out the pages you do not want and keep the rest in order.",
    engine: "remove",
    accept: PDF,
    category: "Organise",
    action: "Delete pages",
    title:
      "Delete Pages From PDF Free — Remove Pages",
    description:
      "Delete pages from a PDF free: blank scans, a cover sheet or an internal appendix. Name the pages to drop and download the trimmed file. Nothing is uploaded.",
    h1: "Delete pages from a PDF",
    intro:
      "Name the pages you want gone and everything else is copied through untouched, in the same order. Handy for pulling an internal costing sheet out of a proposal before it goes to a client.",
    steps: [
      "Add the PDF you want to trim.",
      "Type the pages to delete, like 1, 4-6, last.",
      "Delete and download what is left.",
    ],
    faqs: [
      {
        q: "How do I say which pages to delete?",
        a: "Commas and hyphens: 1, 4-6, 12 removes those. The words first and last work too, so 1, last drops the cover and the back page.",
      },
      {
        q: "Are bookmarks and links kept?",
        a: "Page content, text and images are preserved exactly. Document-level extras like bookmarks and form fields are not carried over, since the remaining pages are copied into a fresh document.",
      },
      {
        q: "What if I delete the wrong pages?",
        a: "Your original file is never modified — the tool only writes a new copy — so just re-run it with a corrected selection.",
      },
    ],
    keywords: [
      "delete pages from pdf",
      "remove pdf pages online",
      "pdf page remover free",
      "delete blank pages pdf",
    ],
    related: ["extract-pdf-pages", "split-pdf", "organize-pdf", "merge-pdf"],
    fields: [
      PAGES_FIELD("Pages to delete", "e.g. 1, 4-6, last", "Commas and hyphens both work."),
    ],
  },
  {
    slug: "extract-pdf-pages",
    name: "Extract PDF pages",
    tagline: "Pull a handful of pages out into a new document.",
    engine: "extract",
    accept: PDF,
    category: "Organise",
    action: "Extract pages",
    title:
      "Extract PDF Pages Free — Save Selected Pages",
    description:
      "Extract pages from a PDF free and save just the ones you need as a new file. Pick pages from a contact sheet or type the range. No upload and no sign-up.",
    h1: "Extract pages from a PDF",
    intro:
      "The opposite of deleting: you name what to keep, and only those pages make it into the new file — in the order you list them.",
    steps: [
      "Add the source PDF.",
      "Type the pages to keep, for example 3, 7-9.",
      "Extract and download the new document.",
    ],
    faqs: [
      {
        q: "Does the order I type the pages matter?",
        a: "Yes. Typing 5, 1, 3 gives you those pages in that order, which makes this a quick way to reorder a short document as well as to extract from it.",
      },
      {
        q: "Can I extract one page as its own PDF?",
        a: "Type the single page number and you get a one-page PDF back. For every page as a separate file, use the split tool instead.",
      },
      {
        q: "Is the extracted page identical to the original?",
        a: "Yes — the page is copied whole, so fonts, vectors and image resolution are unchanged and the text stays selectable.",
      },
    ],
    keywords: [
      "extract pages from pdf",
      "save selected pdf pages",
      "pdf page extractor",
      "get one page from pdf",
    ],
    related: ["split-pdf", "remove-pages-from-pdf", "organize-pdf", "merge-pdf"],
    fields: [
      PAGES_FIELD("Pages to keep", "e.g. 3, 7-9", "They come out in the order you type them."),
    ],
  },
  {
    slug: "organize-pdf",
    name: "Organise PDF",
    tagline: "Reorder the pages of a document into any sequence you want.",
    engine: "organize",
    accept: PDF,
    category: "Organise",
    action: "Reorder pages",
    title:
      "Organise PDF Free — Reorder PDF Pages",
    description:
      "Reorder PDF pages free by writing the sequence you want. Move a signature page, fix an out-of-order tender pack, and download — all inside your browser.",
    h1: "Reorder the pages of a PDF",
    intro:
      "Write the page order you want and the document is rebuilt to match. You can move, repeat or drop pages in one pass — anything you leave out simply is not included.",
    steps: [
      "Add the PDF whose pages are out of sequence.",
      "Type the order, for example 1, 5, 2-4, 6-last.",
      "Reorder and download the rebuilt file.",
    ],
    faqs: [
      {
        q: "Can I duplicate a page?",
        a: "A page number is only used once per run, so a repeat in your list is ignored. To duplicate a page, extract it separately and merge it back in where you want it.",
      },
      {
        q: "What happens to pages I do not list?",
        a: "They are left out of the new document. If you want to keep everything, make sure your sequence covers the whole range — ending with -last is the easy way.",
      },
      {
        q: "Can I reverse the whole document?",
        a: "Yes, but the dedicated reverse tool does it in one click without you having to type the sequence.",
      },
    ],
    keywords: [
      "organize pdf",
      "reorder pdf pages",
      "rearrange pdf online free",
      "change pdf page order",
    ],
    related: ["reverse-pdf", "merge-pdf", "extract-pdf-pages", "rotate-pdf"],
    fields: [
      PAGES_FIELD("New page order", "e.g. 1, 5, 2-4, 6-last", "Every page you want, in the order you want it."),
    ],
  },
  {
    slug: "reverse-pdf",
    name: "Reverse PDF",
    tagline: "Flip the page order back to front in one click.",
    engine: "reverse",
    accept: PDF,
    category: "Organise",
    action: "Reverse pages",
    title:
      "Reverse PDF Page Order — Fix a Backwards Scan",
    description:
      "Reverse the page order of a PDF in one click — the usual fix when a sheet-fed scanner reads a stack back to front. Free, no upload, nothing to install.",
    h1: "Reverse the page order of a PDF",
    intro:
      "Sheet-fed scanners routinely produce documents back to front. This flips the whole sequence in one pass, with no page numbers to type.",
    steps: [
      "Add the back-to-front PDF.",
      "Press Reverse pages.",
      "Download the corrected document.",
    ],
    faqs: [
      {
        q: "Why did my scanner produce a reversed PDF?",
        a: "Feeding a stack face-up into a scanner that reads from the top gives you the last sheet first. Reversing the finished PDF is faster than rescanning.",
      },
      {
        q: "Can I reverse only part of a document?",
        a: "Use the organise tool for that — writing something like 1-4, 10-5 reverses just the second half.",
      },
      {
        q: "Does this change the quality?",
        a: "No. Pages are copied as they are; only their order in the document changes.",
      },
    ],
    keywords: [
      "reverse pdf pages",
      "flip pdf page order",
      "pdf scanned backwards fix",
    ],
    related: ["organize-pdf", "split-pdf", "merge-pdf", "rotate-pdf"],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    tagline: "Turn every page of a PDF into a JPG image.",
    engine: "toJpg",
    accept: PDF,
    category: "Convert",
    action: "Convert to JPG",
    title:
      "PDF to JPG Free — Convert PDF Pages to Images",
    description:
      "Convert PDF to JPG free at 72, 150 or 300 DPI and download the images as a zip. Ideal for slides, listings and WhatsApp. Runs in your browser, never uploaded.",
    h1: "Convert a PDF to JPG images",
    intro:
      "Every page comes out as its own JPG, numbered in order — the quickest way to get a document into a slide deck, a listing or a WhatsApp message.",
    steps: [
      "Add the PDF you want as images.",
      "Choose a resolution — 150 DPI for screens, 300 for print.",
      "Convert and download the images as a zip.",
    ],
    faqs: [
      {
        q: "What resolution should I pick?",
        a: "72 DPI for a quick preview, 150 DPI for anything read on screen, and 300 DPI when the image will be printed or cropped into. Higher settings take longer and use more memory.",
      },
      {
        q: "Can I convert just one page?",
        a: "Extract that page first, then run the conversion on the one-page file — you will get a single JPG rather than a zip.",
      },
      {
        q: "Should I use JPG or PNG?",
        a: "JPG for scans and photographs, where it is far smaller. PNG for pages that are mostly text, diagrams or screenshots, where its sharp edges look noticeably better.",
      },
    ],
    keywords: [
      "pdf to jpg",
      "convert pdf to image",
      "pdf to jpeg free online",
      "pdf pages to images",
    ],
    related: ["pdf-to-png", "jpg-to-pdf", "compress-pdf", "pdf-to-text"],
    fields: [
      {
        key: "dpi",
        label: "Resolution",
        type: "select",
        default: "150",
        options: [
          { value: "72", label: "72 DPI — screen preview" },
          { value: "150", label: "150 DPI — recommended" },
          { value: "300", label: "300 DPI — print quality" },
        ],
      },
    ],
  },
  {
    slug: "pdf-to-png",
    name: "PDF to PNG",
    tagline: "Export PDF pages as lossless PNG images.",
    engine: "toPng",
    accept: PDF,
    category: "Convert",
    action: "Convert to PNG",
    title:
      "PDF to PNG Free — Lossless Page Images",
    description:
      "Convert PDF to PNG free at the resolution you choose. Lossless, so text, tables and screenshots stay sharp where JPG blurs them. No upload and no sign-up.",
    h1: "Convert a PDF to PNG images",
    intro:
      "PNG keeps hard edges clean, which is what you want for pages that are mostly type, tables or diagrams — no JPG fuzz around the letters.",
    steps: [
      "Add the PDF.",
      "Pick a resolution.",
      "Convert and download the PNGs.",
    ],
    faqs: [
      {
        q: "Why is the PNG bigger than the JPG version?",
        a: "PNG is lossless, so nothing is thrown away. That is exactly why text stays sharp — if size matters more than edge quality, use the JPG tool.",
      },
      {
        q: "Do the PNGs have a transparent background?",
        a: "No. Pages are rendered on white, matching how the PDF prints. A transparent background would make most documents unreadable on a dark page.",
      },
      {
        q: "How many pages can I convert at once?",
        a: "As many as your device's memory allows. Rendering happens page by page, so long documents work — they just take longer at higher resolutions.",
      },
    ],
    keywords: [
      "pdf to png",
      "convert pdf to png online",
      "pdf page to image lossless",
    ],
    related: ["pdf-to-jpg", "png-to-pdf", "pdf-to-text", "compress-pdf"],
    fields: [
      {
        key: "dpi",
        label: "Resolution",
        type: "select",
        default: "150",
        options: [
          { value: "72", label: "72 DPI — screen preview" },
          { value: "150", label: "150 DPI — recommended" },
          { value: "300", label: "300 DPI — print quality" },
        ],
      },
    ],
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    tagline: "Turn photos into a single, properly paginated PDF.",
    engine: "imageToPdf",
    accept: IMG,
    multiple: true,
    category: "Convert",
    action: "Create PDF",
    title:
      "JPG to PDF Free — Convert Photos to PDF",
    description:
      "Convert JPG photos to one PDF free, fitted to A4 or Letter with the margins you set. The fix when a form only accepts a PDF and your documents are photos.",
    h1: "Convert JPG images to a PDF",
    intro:
      "The usual reason for this is a form that will only accept a PDF while your documents are photos on your phone. Add them in order, pick a page size, and you get one clean file.",
    steps: [
      "Add your images — drag several in at once and reorder them.",
      "Choose a page size, orientation and margin.",
      "Create the PDF and download it.",
    ],
    faqs: [
      {
        q: "Can I mix JPG and PNG in one PDF?",
        a: "Yes. Anything your browser can open — JPG, PNG, WebP, most HEIC photos — can go into the same document, in whatever order you arrange the cards.",
      },
      {
        q: "How do I control the page order?",
        a: "Drag the cards after adding them. The PDF follows that order exactly, one image per page.",
      },
      {
        q: "Why does my photo have white space around it?",
        a: "Fitting a photo to A4 leaves bars wherever the shapes do not match. Choose Fit to image instead and each page is sized to its own photo.",
      },
    ],
    keywords: [
      "jpg to pdf",
      "image to pdf converter",
      "photos to pdf online free",
      "convert picture to pdf",
    ],
    related: ["png-to-pdf", "pdf-to-jpg", "merge-pdf", "compress-pdf"],
    fields: [
      {
        key: "size",
        label: "Page size",
        type: "select",
        default: "a4",
        options: [
          { value: "a4", label: "A4" },
          { value: "letter", label: "US Letter" },
          { value: "fit", label: "Fit to image" },
        ],
      },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        default: "portrait",
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ],
      },
      { key: "margin", label: "Margin (pt)", type: "number", default: "24", min: 0, max: 120 },
    ],
  },
  {
    slug: "png-to-pdf",
    name: "PNG to PDF",
    tagline: "Put screenshots and graphics into a shareable PDF.",
    engine: "imageToPdf",
    accept: IMG,
    multiple: true,
    category: "Convert",
    action: "Create PDF",
    title:
      "PNG to PDF Free — Screenshots to One PDF",
    description:
      "Convert PNG screenshots into a single PDF free, at full resolution so interface text stays sharp. Arrange the order, then download. Nothing is uploaded.",
    h1: "Convert PNG images to a PDF",
    intro:
      "Screenshots are far easier to send as one PDF than as fifteen attachments. Drop them in, set the order, and they come back as a single paginated document.",
    steps: [
      "Add your PNG files.",
      "Set the page size and margin.",
      "Create the PDF and download it.",
    ],
    faqs: [
      {
        q: "Is transparency preserved?",
        a: "Transparent areas render as white, because a PDF page has no transparency behind it. Flatten the image onto the background you want first if that matters.",
      },
      {
        q: "Will my screenshots stay sharp?",
        a: "Yes — the PNG is embedded at full resolution rather than re-encoded, so it is as sharp in the PDF as it is on disk.",
      },
      {
        q: "Can I make one PDF per image?",
        a: "Convert them together, then run the split tool on the result to get each page as its own file.",
      },
    ],
    keywords: [
      "png to pdf",
      "screenshot to pdf",
      "convert png to pdf free",
    ],
    related: ["jpg-to-pdf", "pdf-to-png", "merge-pdf", "compress-pdf"],
    fields: [
      {
        key: "size",
        label: "Page size",
        type: "select",
        default: "a4",
        options: [
          { value: "a4", label: "A4" },
          { value: "letter", label: "US Letter" },
          { value: "fit", label: "Fit to image" },
        ],
      },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        default: "portrait",
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ],
      },
      { key: "margin", label: "Margin (pt)", type: "number", default: "24", min: 0, max: 120 },
    ],
  },
  {
    slug: "convert-to-pdf",
    name: "Convert to PDF",
    tagline: "Drop any file — it works out what it is and makes a PDF of it.",
    engine: "anyToPdf",
    accept: "*",
    multiple: true,
    detects: true,
    category: "Convert",
    action: "Convert to PDF",
    title: "Convert Any File to PDF Free — Auto Detect",
    description:
      "Convert any file to PDF free: Word, Excel, PowerPoint, Pages, images, HEIC, PSD, TIFF, EPUB or text. The format is detected for you, several files become one PDF, nothing is uploaded.",
    h1: "Convert any file to PDF",
    intro:
      "Every other converter asks you to pick the format first, which is a strange question given the file is right there. Drop anything in and this reads the file itself — not its name, which is often wrong — and converts it. A Word file, a Keynote deck, three phone photos and a Photoshop mock-up can go in together, and one PDF comes out in the order you arranged them.",
    steps: [
      "Drop your files in — one, or a stack of different kinds.",
      "Each is identified and shown with what it was recognised as.",
      "Choose a page size, then convert and download.",
    ],
    faqs: [
      {
        q: "Which formats does it handle?",
        a: "PDF and Illustrator artwork; Word, Excel and PowerPoint; OpenDocument text, spreadsheets and slides; Pages, Numbers and Keynote; RTF, EPUB and saved emails; every image your browser can open — JPG, PNG, WebP, HEIC, AVIF, GIF, BMP, SVG — plus TIFF and Photoshop files, which browsers cannot open and this tool decodes itself; and HTML, Markdown, CSV and plain text, including source code. The pre-2007 Office formats (.doc, .xls, .ppt) are the remaining gap: open one and save it in the modern format, and it converts.",
      },
      {
        q: "How does it know what my file is?",
        a: "It reads the first few kilobytes and matches the signature every format starts with, so a photo saved as `document.pdf` is still recognised as a photo. Extensions are only consulted to tell apart things that are identical on disk — plain text, Markdown and CSV are all just text.",
      },
      {
        q: "How close is a Word document to the original?",
        a: "Headings, bold and italic, lists, tables and page breaks all carry over; Word's exact fonts, columns and floating images do not. It is a clean, readable document rather than a pixel match — for a pixel match, use Save as PDF inside Word itself. Nothing here can run Word's layout engine, and any browser tool that claims otherwise is uploading your file to a server that can.",
      },
      {
        q: "What happens to a PowerPoint or Keynote deck?",
        a: "A PowerPoint deck becomes one page per slide carrying that slide's title, its bullets and its speaker notes — the text, not a picture of the design. Keynote and Pages are different: those are read through the preview Apple saves inside the file, which is usually a PDF of the whole document and comes through exactly as it looks.",
      },
      {
        q: "It says my file is in an old Office format. Now what?",
        a: "The pre-2007 formats — .doc, .xls, .ppt — are a different thing entirely from today's .docx and .xlsx, which are readable zips. Open the file in Word, Excel, PowerPoint, LibreOffice or Google Docs and save it again in the modern format, and it converts here. Anything since about 2007 already is the modern format.",
      },
      {
        q: "Can I convert several files at once?",
        a: "Yes, and by default they become a single PDF in the order you arrange the cards. Turn off Combine and you get one PDF per file, zipped together.",
      },
      {
        q: "What happens if one file will not convert?",
        a: "The rest still do. A file that cannot be read is skipped and named afterwards with the reason, so one bad attachment never costs you the other nine.",
      },
      {
        q: "Is anything uploaded?",
        a: "No. The detection, the conversion and the writing all happen in this tab — which is why a contract or a payslip is safe here. Turn off your Wi-Fi after the page loads and it still works.",
      },
    ],
    keywords: [
      "convert to pdf",
      "any file to pdf",
      "file to pdf converter free",
      "word to pdf",
      "docx to pdf online free",
      "excel to pdf",
      "powerpoint to pdf",
      "psd to pdf",
      "tiff to pdf",
      "html to pdf",
      "convert file to pdf no sign up",
    ],
    related: ["merge-pdf", "jpg-to-pdf", "compress-pdf", "pdf-to-text"],
    fields: [
      {
        key: "size",
        label: "Page size",
        type: "select",
        default: "a4",
        options: [
          { value: "a4", label: "A4" },
          { value: "letter", label: "US Letter" },
          { value: "legal", label: "US Legal" },
          { value: "fit", label: "Fit to image" },
        ],
        help: "Fit to image sizes each image page to the picture itself; documents always use A4.",
      },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        default: "portrait",
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ],
      },
      {
        key: "margin",
        label: "Margin (pt)",
        type: "number",
        default: "56",
        min: 0,
        max: 160,
      },
      {
        key: "combine",
        label: "Combine into one PDF",
        type: "toggle",
        default: "on",
        help: "Off gives one PDF per file, zipped.",
      },
    ],
  },
  {
    slug: "add-page-numbers",
    name: "Add page numbers",
    tagline: "Number the pages of a PDF, in the position and format you want.",
    engine: "pageNumbers",
    accept: PDF,
    category: "Edit",
    action: "Add numbers",
    title:
      "Add Page Numbers to PDF Free — Any Position",
    description:
      "Add page numbers to a PDF free in any corner, in formats like Page 3 of 12, starting from any number and skipping the cover. Browser-based, never uploaded.",
    h1: "Add page numbers to a PDF",
    intro:
      "Numbering a document after it has been assembled — a merged tender, a contract with annexures — usually means reopening the source files. This stamps the numbers straight onto the finished PDF.",
    steps: [
      "Add the PDF that needs numbering.",
      "Choose a position, a format and the number to start from.",
      "Stamp the numbers and download.",
    ],
    faqs: [
      {
        q: "Can I write 'Page 3 of 12' instead of just the number?",
        a: "Yes. In the format box, n is replaced by the current page and total by the page count, so Page n of total produces exactly that.",
      },
      {
        q: "How do I leave the cover page unnumbered?",
        a: "Turn on 'Skip the first page'. Numbering then begins on page two, counting from your chosen start number.",
      },
      {
        q: "Will the numbers cover up my content?",
        a: "They sit in the page margin, about 28 points from the edge. If your layout already fills the margin, crop the page first or use a different corner.",
      },
    ],
    keywords: [
      "add page numbers to pdf",
      "number pdf pages online",
      "pdf page numbering free",
    ],
    related: ["edit-pdf", "watermark-pdf", "merge-pdf", "crop-pdf"],
    fields: [
      {
        key: "position",
        label: "Position",
        type: "select",
        default: "bottom-center",
        options: [
          { value: "bottom-center", label: "Bottom centre" },
          { value: "bottom-right", label: "Bottom right" },
          { value: "bottom-left", label: "Bottom left" },
          { value: "top-center", label: "Top centre" },
          { value: "top-right", label: "Top right" },
          { value: "top-left", label: "Top left" },
        ],
      },
      {
        key: "format",
        label: "Format",
        type: "text",
        default: "n",
        placeholder: "n  or  Page n of total",
        help: "n becomes the page number, total becomes the page count.",
      },
      { key: "start", label: "Start at", type: "number", default: "1", min: 0 },
      { key: "size", label: "Text size (pt)", type: "number", default: "11", min: 6, max: 36 },
      { key: "skipFirst", label: "Skip the first page", type: "toggle" },
    ],
  },
  {
    slug: "watermark-pdf",
    name: "Watermark PDF",
    tagline: "Stamp DRAFT, CONFIDENTIAL or your own text across every page.",
    engine: "watermark",
    accept: PDF,
    category: "Edit",
    action: "Add watermark",
    title:
      "Watermark PDF Free — Add a Text Watermark",
    description:
      "Add a DRAFT or CONFIDENTIAL watermark to every page of a PDF free, with your own wording, size, angle and opacity. Drafts stay private — nothing is uploaded.",
    h1: "Add a watermark to a PDF",
    intro:
      "Mark a document before it circulates. The watermark is drawn across the middle of every page at the opacity you set, so it reads clearly without burying the content underneath.",
    steps: [
      "Add the PDF.",
      "Type the watermark text and set its size, angle and opacity.",
      "Stamp it and download the marked file.",
    ],
    faqs: [
      {
        q: "What opacity should I use?",
        a: "Around 15% is the standard: obvious enough to read at a glance, faint enough to read the page through. Push to 30% if the document will be printed on an office laser printer.",
      },
      {
        q: "Can the watermark be removed later?",
        a: "Yes — it is tagged as a watermark the way Acrobat tags its own, so the Remove Watermark tool takes it off in one step and leaves the page untouched. That also means anyone else can: treat a watermark as a label, not as security.",
      },
      {
        q: "Can I use an image or a logo?",
        a: "Not yet — this tool stamps text only. For a logo, place it in your source document before exporting the PDF.",
      },
    ],
    keywords: [
      "watermark pdf",
      "add watermark to pdf free",
      "stamp draft on pdf",
      "confidential watermark pdf",
    ],
    related: ["remove-watermark", "edit-pdf", "add-page-numbers", "flatten-pdf"],
    fields: [
      { key: "text", label: "Watermark text", type: "text", default: "CONFIDENTIAL" },
      { key: "size", label: "Text size (pt)", type: "number", default: "52", min: 8, max: 200 },
      { key: "opacity", label: "Opacity (%)", type: "number", default: "15", min: 1, max: 100 },
      {
        key: "angle",
        label: "Angle",
        type: "select",
        default: "45",
        options: [
          { value: "45", label: "45° diagonal" },
          { value: "0", label: "Horizontal" },
          { value: "90", label: "Vertical" },
        ],
      },
    ],
  },
  {
    slug: "remove-watermark",
    name: "Remove Watermark",
    tagline: "Take a watermark off a PDF, photo or screenshot without a trace.",
    engine: "unwatermark",
    accept: `${PDF},${IMG}`,
    category: "Edit",
    custom: "unwatermark",
    action: "Remove watermark",
    title: "Remove Watermark Free — From PDF, JPG and PNG",
    description:
      "Remove a watermark from a PDF, JPG, PNG or WebP free. PDF watermarks are deleted cleanly; on images, AI fills the spot in. No upload, no sign-up.",
    h1: "Remove a watermark from a PDF or image",
    intro:
      "Most PDF watermarks are a separate layer, so they are deleted outright and the page underneath comes back exactly as it was — text still selectable, nothing redrawn. When the watermark is part of the picture, paint over it: a see-through watermark is mathematically un-mixed so the real detail underneath comes back, and a solid one is filled in by an AI model from its surroundings. Only the pixels you painted change, and it all runs in this tab — your file is never uploaded.",
    steps: [
      "Open a PDF, image or document. A PDF is checked for a watermark layer straight away and cleaned if it has one.",
      "Anything still showing: paint tightly over it with the brush and press Remove watermark.",
      "Hold Compare to check against the original, then download — PDFs come back as PDFs, images in their own format.",
    ],
    faqs: [
      {
        q: "Will the rest of my image or page change?",
        a: "No. Only what you paint is replaced; every other pixel is the pixel you gave it, at full resolution. On a PDF with a watermark layer, nothing is repainted at all — the layer is deleted and the page is otherwise byte-for-byte the same.",
      },
      {
        q: "How good is it on a photo?",
        a: "Most watermarks are see-through, and for those the real picture is still underneath — the tool works out the watermark's colour and opacity and reverses it, so a face under the letters comes back as the actual face. A solid, opaque watermark hides what was behind it completely; there the AI model fills the spot from its surroundings, which is near-invisible on skies, walls and fabric but has to invent detail on a face or small print. Paint tightly, and use Hold to compare.",
      },
      {
        q: "Why does it download something the first time?",
        a: "The fill is done by an AI model that runs on your own device, about 200 MB, downloaded once and then kept by your browser. Your image is never sent anywhere — the model comes to the file, not the other way round. If it cannot load, a simpler fill is used instead.",
      },
      {
        q: "Which files does it take?",
        a: "PDFs, every common image format — JPG, PNG, WebP, GIF, BMP, AVIF, SVG, TIFF and Photoshop PSD — and documents such as Word, PowerPoint, Excel and Pages, which are turned into a PDF first. Images come back in their own format where the browser can write it, and as PNG otherwise.",
      },
      {
        q: "Can I remove a watermark on every page of a PDF at once?",
        a: "Yes. A layer watermark is removed from every page automatically. For one that is part of the page, paint it once and leave Same spot on every page switched on — the fill runs on each page in turn. Only those pages are re-rendered; the rest keep their text.",
      },
      {
        q: "Is it legal to remove a watermark?",
        a: "From your own files — your drafts, your photos, documents you have the rights to — yes. Removing a watermark from someone else's photo or stock image to use it without a licence is copyright infringement in most countries, and this tool does not change that.",
      },
    ],
    keywords: [
      "remove watermark",
      "remove watermark from pdf",
      "remove watermark from image",
      "watermark remover free",
      "remove watermark from photo",
      "remove draft watermark from pdf",
    ],
    related: ["watermark-pdf", "edit-pdf", "flatten-pdf", "crop-pdf"],
  },
  {
    slug: "crop-pdf",
    name: "Crop PDF",
    tagline: "Trim the margins off every page at once.",
    engine: "crop",
    accept: PDF,
    category: "Edit",
    action: "Crop pages",
    title:
      "Crop PDF Free — Trim Margins and Scan Edges",
    description:
      "Crop PDF margins free: cut a scanner's black border or white space off every page by setting a trim per side. Free, no sign-up, and the content is untouched.",
    h1: "Crop the margins of a PDF",
    intro:
      "Set how much to take off each side and the crop applies to every page. The usual reasons are a scanner edge you want gone, or squeezing more of the text onto an e-reader screen.",
    steps: [
      "Add the PDF.",
      "Enter how many points to trim from the top, bottom, left and right (72 points = 1 inch).",
      "Crop and download the trimmed file.",
    ],
    faqs: [
      {
        q: "What is a point?",
        a: "A PDF point is 1/72 of an inch, so 72 trims an inch and 28 trims about a centimetre. An A4 page is 595 × 842 points.",
      },
      {
        q: "Is the cropped content deleted?",
        a: "No. Cropping sets the visible box, so the trimmed area is hidden rather than removed — which means the crop is fully reversible, but also that the file does not get smaller.",
      },
      {
        q: "Can I crop different pages differently?",
        a: "Not in one pass. Split the document, crop each part with its own margins, and merge it back together.",
      },
    ],
    keywords: [
      "crop pdf",
      "trim pdf margins",
      "remove white space pdf",
      "crop pdf online free",
    ],
    related: ["rotate-pdf", "compress-pdf", "split-pdf", "flatten-pdf"],
    fields: [
      { key: "top", label: "Trim top (pt)", type: "number", default: "0", min: 0 },
      { key: "bottom", label: "Trim bottom (pt)", type: "number", default: "0", min: 0 },
      { key: "left", label: "Trim left (pt)", type: "number", default: "0", min: 0 },
      { key: "right", label: "Trim right (pt)", type: "number", default: "0", min: 0 },
    ],
  },
  {
    slug: "flatten-pdf",
    name: "Flatten PDF",
    tagline: "Freeze forms, layers and annotations into the page.",
    engine: "flatten",
    accept: PDF,
    category: "Secure",
    action: "Flatten PDF",
    title:
      "Flatten PDF Free — Lock Form Fields for Good",
    description:
      "Flatten a PDF free so filled form fields, signatures and comments become permanent page content nobody can edit or clear by accident. Nothing is uploaded.",
    h1: "Flatten a PDF",
    intro:
      "A filled form is still editable — the next person to open it can change your answers or wipe them by mistake. Flattening bakes everything into the page so what you send is what they see.",
    steps: [
      "Add the filled form or annotated PDF.",
      "Choose a rendering quality.",
      "Flatten and download the locked-down file.",
    ],
    faqs: [
      {
        q: "What does flattening actually do?",
        a: "Each page is rendered exactly as it appears, including field values and annotations, and that rendering becomes the page. The interactive layer no longer exists to be edited.",
      },
      {
        q: "Will the text still be searchable?",
        a: "No. Flattening converts pages to images, so the text layer is lost. Keep the original if you need to search or copy from it later.",
      },
      {
        q: "Is a flattened PDF the same as a protected one?",
        a: "No. Flattening stops casual editing of fields and comments; it is not encryption and does not stop anyone opening the file.",
      },
    ],
    keywords: [
      "flatten pdf",
      "flatten pdf form fields",
      "lock pdf form online",
      "make pdf non editable",
    ],
    related: ["edit-pdf", "watermark-pdf", "compress-pdf", "unlock-pdf"],
    fields: [
      {
        key: "scale",
        label: "Quality",
        type: "select",
        default: "2",
        options: [
          { value: "1.5", label: "Standard" },
          { value: "2", label: "High — recommended" },
          { value: "3", label: "Maximum — larger file" },
        ],
      },
    ],
  },
  {
    slug: "grayscale-pdf",
    name: "Greyscale PDF",
    tagline: "Convert a colour PDF to black and white for cheaper printing.",
    engine: "grayscale",
    accept: PDF,
    category: "Optimise",
    action: "Convert to greyscale",
    title:
      "PDF to Greyscale — Black and White PDF Free",
    description:
      "Convert a colour PDF to greyscale free so it prints on a mono printer without a colour surcharge, and usually shrinks too. Converted in your browser.",
    h1: "Convert a PDF to greyscale",
    intro:
      "Print shops charge by the colour page, and a deck with one tinted logo per slide counts as colour throughout. Converting to greyscale first removes the surcharge and usually shrinks the file too.",
    steps: [
      "Add the colour PDF.",
      "Choose a rendering quality.",
      "Convert and download the greyscale version.",
    ],
    faqs: [
      {
        q: "Why is the greyscale file sometimes smaller?",
        a: "Colour information is discarded and pages are re-encoded, so image-heavy documents often shrink substantially. Text-only files may not change much.",
      },
      {
        q: "Is this the same as printing in black and white?",
        a: "The result is the same on the page, but this changes the file itself — so it stays greyscale wherever it is opened, rather than relying on a print setting.",
      },
      {
        q: "Can I get the colour back afterwards?",
        a: "No. Colour is removed from the output, so keep your original if you will need it again.",
      },
    ],
    keywords: [
      "pdf to grayscale",
      "convert pdf to black and white",
      "greyscale pdf online free",
    ],
    related: ["compress-pdf", "flatten-pdf", "pdf-to-jpg", "crop-pdf"],
    fields: [
      {
        key: "scale",
        label: "Quality",
        type: "select",
        default: "2",
        options: [
          { value: "1.5", label: "Standard" },
          { value: "2", label: "High — recommended" },
          { value: "3", label: "Maximum — larger file" },
        ],
      },
    ],
  },
  {
    slug: "pdf-to-text",
    name: "PDF to text",
    tagline: "Pull the text out of a PDF as a plain .txt file.",
    engine: "toText",
    accept: PDF,
    category: "Convert",
    action: "Extract text",
    title:
      "PDF to Text Free — Extract Text From a PDF",
    description:
      "Extract text from a PDF free into a clean .txt file, without the broken line breaks you get from copy and paste. Works with any script. Nothing is uploaded.",
    h1: "Extract the text from a PDF",
    intro:
      "Copying out of a PDF reader tends to arrive full of broken line breaks. This walks the document's own text layer page by page and gives you a clean .txt file.",
    steps: [
      "Add the PDF.",
      "Choose whether to mark where each page begins.",
      "Extract and download the text file.",
    ],
    faqs: [
      {
        q: "Why did I get an empty file?",
        a: "Your PDF is almost certainly a scan — a picture of text with no text layer to read. Extracting that needs OCR, which this tool does not do.",
      },
      {
        q: "Will the layout be preserved?",
        a: "Reading order is preserved and line breaks are reconstructed, but columns, tables and exact spacing are not. It is text for reuse, not a visual copy.",
      },
      {
        q: "Does this work with other languages?",
        a: "Yes. The text comes out in whatever encoding the PDF stores, and the file is written as UTF-8, so Hindi, Bengali and other scripts extract correctly.",
      },
    ],
    keywords: [
      "pdf to text",
      "extract text from pdf",
      "pdf to txt converter free",
      "copy text from pdf",
    ],
    related: ["pdf-to-jpg", "edit-pdf-metadata", "split-pdf", "compress-pdf"],
    fields: [
      {
        key: "pageBreaks",
        label: "Page markers",
        type: "select",
        default: "on",
        options: [
          { value: "on", label: "Mark where each page starts" },
          { value: "off", label: "One continuous block of text" },
        ],
      },
    ],
  },
  {
    slug: "edit-pdf-metadata",
    name: "Edit PDF metadata",
    tagline: "Change or strip the title, author and keywords on a PDF.",
    engine: "metadata",
    accept: PDF,
    category: "Secure",
    action: "Save metadata",
    title:
      "Edit PDF Metadata — Change or Remove Info",
    description:
      "Edit PDF metadata free: set the title, author, subject and keywords, or strip the lot before a document leaves your hands. Browser-based, never uploaded.",
    h1: "Edit the metadata of a PDF",
    intro:
      "Every PDF carries hidden properties, and an exported document often still names the template's original author. Rewrite those fields, or clear them entirely before the file leaves your hands.",
    steps: [
      "Add the PDF.",
      "Fill in the fields you want to set — or tick 'Remove all metadata'.",
      "Save and download the updated file.",
    ],
    faqs: [
      {
        q: "Where does this metadata show up?",
        a: "In the document properties panel of any PDF reader, in file listings, and to search engines when the PDF is published on a website — which is why a stale author name is worth fixing.",
      },
      {
        q: "Does removing metadata make the file anonymous?",
        a: "It clears the standard document properties. Content itself — a signature, a letterhead, tracked text — is untouched, so review the pages too if anonymity is the goal.",
      },
      {
        q: "Can I leave a field unchanged?",
        a: "Yes. Empty boxes are left alone, so you can update only the title without touching the rest.",
      },
    ],
    keywords: [
      "edit pdf metadata",
      "change pdf author",
      "remove pdf metadata online",
      "pdf properties editor",
    ],
    related: ["flatten-pdf", "watermark-pdf", "unlock-pdf", "merge-pdf"],
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "Leave empty to keep" },
      { key: "author", label: "Author", type: "text", placeholder: "Leave empty to keep" },
      { key: "subject", label: "Subject", type: "text", placeholder: "Leave empty to keep" },
      { key: "keywords", label: "Keywords", type: "text", placeholder: "comma, separated" },
      { key: "strip", label: "Remove all metadata instead", type: "toggle" },
    ],
  },
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    tagline: "Remove the password and restrictions from a PDF you own.",
    engine: "unlock",
    accept: PDF,
    category: "Secure",
    action: "Unlock PDF",
    title:
      "Unlock PDF Free — Remove Password and Limits",
    description:
      "Unlock a PDF you own free: remove printing and copying restrictions, or strip a known open password. The password is used in your browser and never sent.",
    h1: "Unlock a protected PDF",
    intro:
      "Bank and utility statements arrive locked, and plenty of documents block printing or copying for no good reason. Unlock a file you are entitled to open and get a clean copy back.",
    steps: [
      "Add the protected PDF.",
      "If it asks for a password to open, type it in.",
      "Unlock and download the unrestricted file.",
    ],
    faqs: [
      {
        q: "Can this crack a password I do not know?",
        a: "No, and it is not meant to. Restrictions that only limit printing or copying are removed outright; a password that encrypts the file has to be supplied before anything can be read.",
      },
      {
        q: "Is it safe to type my password here?",
        a: "It stays in this tab. The PDF is decrypted by JavaScript on your own machine — nothing is sent anywhere, which you can confirm by running the tool offline.",
      },
      {
        q: "Why is the unlocked file sometimes larger?",
        a: "When an open password has to be used, the pages are rebuilt from a rendered copy, which loses the text layer and can change the size. Files that were only restricted are re-saved as they are.",
      },
    ],
    keywords: [
      "unlock pdf",
      "remove pdf password",
      "pdf password remover free",
      "remove pdf restrictions",
    ],
    related: ["flatten-pdf", "edit-pdf-metadata", "compress-pdf", "merge-pdf"],
    fields: [
      {
        key: "password",
        label: "Password (only if the file needs one to open)",
        type: "text",
        placeholder: "Leave empty for restricted files",
      },
    ],
  },
];

export const bySlug = (slug: string) => tools.find((t) => t.slug === slug);

export const categories = [
  "Organise",
  "Optimise",
  "Convert",
  "Edit",
  "Secure",
] as const;
