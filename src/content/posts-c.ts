import type { Post } from "./types";

/** Page order, conversion and marking up. */
export const postsC: Post[] = [
  {
    slug: "how-to-extract-pages-from-a-pdf",
    tool: "extract-pdf-pages",
    title: "How to Extract Pages From a PDF",
    h1: "How to extract pages from a PDF",
    description:
      "Pull the pages you need out of a long PDF into a new file, in the order you name them, and know when to extract rather than split or delete.",
    date: "2026-08-22",
    minutes: 3,
    lead:
      "Extracting is the inverse of deleting: instead of naming what to lose, you name what to keep. For anything where the keep list is shorter than the drop list — three pages out of ninety — it is far less typing and far less error-prone.",
    sections: [
      {
        h: "The order you type is the order you get",
        body: [
          "Typing 5, 1, 3 gives you those three pages in that sequence, which quietly makes extraction a reordering tool as well. For a short document, it is often faster than opening an organiser.",
          "Ranges work the same way as everywhere else: 3, 7-9 keeps four pages, and everything unnamed is left behind.",
        ],
      },
      {
        h: "Extract, split or delete?",
        body: [
          [
            "Extract when you want a few pages as one new document — the signature pages of a contract, one section of a report.",
            "Split when you want the whole document broken into several files at once.",
            "Delete when you are keeping nearly everything and dropping a handful.",
          ],
          "All three copy page objects rather than re-rendering them, so none of them costs you quality. The choice is only about which is less work to describe.",
        ],
      },
      {
        h: "One page as its own file",
        body: [
          "Naming a single page gives you a one-page PDF — the usual precursor to converting that page to an image, since a one-page conversion downloads directly instead of arriving as a zip.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is an extracted page identical to the original?",
        a: "Yes. The page is copied whole, so fonts, vectors and image resolution are unchanged and the text stays selectable.",
      },
      {
        q: "Can I extract pages from a protected PDF?",
        a: "Not while it is encrypted. Remove the password first, then extract from the result.",
      },
      {
        q: "How do I extract every page separately?",
        a: "Use the split tool with a chunk size of one page — that is exactly what it is for.",
      },
    ],
    keywords: [
      "how to extract pages from a pdf",
      "save selected pdf pages",
      "get one page out of a pdf",
    ],
  },
  {
    slug: "how-to-reorder-pdf-pages",
    tool: "organize-pdf",
    title: "How to Reorder the Pages of a PDF",
    h1: "How to reorder the pages of a PDF",
    description:
      "Rearrange a PDF into any sequence by writing the order you want, and fix the two things that most often go wrong in an assembled document.",
    date: "2026-08-22",
    minutes: 3,
    lead:
      "Assembled documents come out in the wrong order more often than any single source file does. An annexure lands before the section that refers to it, a signature page ends up at the front, and the fix is to describe the sequence you actually want.",
    sections: [
      {
        h: "Writing a sequence",
        body: [
          "The order you type is the document you get: 1, 5, 2-4, 6-last moves page five up behind the cover and pushes the rest along. Ending with -last is the habit worth forming, because it guarantees nothing is silently dropped.",
          "Anything you leave out is not included. That is a feature when you are reordering and trimming in one pass, and a trap when you forget the tail of the document — which is why -last exists.",
        ],
      },
      {
        h: "Two problems this solves quickly",
        body: [
          [
            "A signature or cover page at the wrong end, usually because it was merged last.",
            "A scan where a stack was fed in the wrong order, so pages run backwards in blocks.",
          ],
          "For a whole document that is simply back to front, the reverse tool does it in one click without typing anything.",
        ],
      },
      {
        h: "What happens to the pages themselves",
        body: [
          "Nothing. Pages are copied into a new document in the order you named, so content, resolution and the text layer are all untouched. Only the catalogue that lists them changes.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I duplicate a page while reordering?",
        a: "A page number is used once per run, so a repeat is ignored. To duplicate, extract the page separately and merge it back in where you want it.",
      },
      {
        q: "What happens to pages I do not list?",
        a: "They are left out of the new document. Cover the whole range — ending with -last — if you mean to keep everything.",
      },
      {
        q: "Is there a visual way to do this?",
        a: "The page thumbnails on the tool let you see what you are working with while you type the sequence, which is usually enough for a document of any length.",
      },
    ],
    keywords: [
      "how to reorder pdf pages",
      "rearrange a pdf",
      "change pdf page order free",
    ],
  },
  {
    slug: "how-to-fix-a-pdf-scanned-in-reverse",
    tool: "reverse-pdf",
    title: "How to Fix a PDF That Scanned in Reverse",
    h1: "How to fix a PDF that scanned in reverse",
    description:
      "Why sheet-fed scanners produce back-to-front documents, how to flip the whole order in one click, and what else to check on the same scan.",
    date: "2026-08-22",
    minutes: 3,
    lead:
      "Feed a stack face-up into a scanner that reads from the top and you get a perfect document in exactly the wrong order. It is one of the most common scanning faults and one of the fastest to fix — certainly faster than scanning the stack again.",
    sections: [
      {
        h: "Why it happens",
        body: [
          "A document feeder takes the top sheet first. If you loaded the stack with page one on top and face up, the scanner reads the last physical sheet as its first image, and the PDF comes out reversed end to end.",
          "Some scanners have a reverse-order setting to compensate. If yours does not, or you have inherited the file from someone else's scanner, flipping the finished PDF is the equivalent fix.",
        ],
      },
      {
        h: "Check these two things on the same file",
        body: [
          [
            "Orientation: the same loading mistake often produces pages that are 180° out as well as reversed. Rotate them once, for the whole document.",
            "Blank backs: a duplex scan of single-sided paper leaves an empty page between every real one. Delete the even-numbered pages.",
          ],
          "Doing all three in sequence — reverse, rotate, delete — takes about a minute and produces a document nobody would guess had been scanned badly.",
        ],
      },
      {
        h: "Reversing only part of a document",
        body: [
          "If only the second half came out backwards, the organise tool takes a descending range: 1-4, 10-5 keeps the first four pages as they are and flips the rest.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is it faster to rescan?",
        a: "Almost never. Reversing a finished PDF is one click, and rescanning risks a fresh set of feed errors on the same stack.",
      },
      {
        q: "Does reversing change quality?",
        a: "No. Pages are copied as they are; only their order in the document changes.",
      },
      {
        q: "Can I reverse just a few pages?",
        a: "Use the organise tool with a descending range for the section that is wrong.",
      },
    ],
    keywords: [
      "pdf scanned in reverse",
      "flip pdf page order",
      "fix backwards scanned document",
    ],
  },
  {
    slug: "pdf-to-png-vs-jpg",
    tool: "pdf-to-png",
    title: "PDF to PNG or JPG: Which to Use and Why",
    h1: "PDF to PNG or JPG: which to use",
    description:
      "The difference lossy and lossless compression make to a page of text, why screenshots belong in PNG, and how transparency behaves when a PDF page becomes an image.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "Both formats can hold a rendered PDF page and both will look fine at a glance. The difference shows up on type: one keeps the edges of letters clean, the other puts a faint haze around them that you cannot remove afterwards.",
    sections: [
      {
        h: "What each format is built for",
        body: [
          "JPG throws away detail your eye is unlikely to miss, which works beautifully on photographs where colour changes gradually. It is why a scanned page compresses so well.",
          "PNG keeps every pixel exactly. That costs size on a photograph and pays for itself on anything with hard edges — text, tables, line drawings, screenshots, a logo on white.",
        ],
      },
      {
        h: "The practical rule",
        body: [
          [
            "Scans and photographic pages — JPG, at 150 DPI for screen or 300 for print.",
            "Text, diagrams, charts, screenshots, UI — PNG, every time.",
            "Anything being posted where size matters more than sharpness — JPG.",
          ],
          "If you are unsure, export one page both ways and look at a heading at 100%. The difference is obvious on type and invisible on a photograph, which tells you which kind of page you have.",
        ],
      },
      {
        h: "Transparency and backgrounds",
        body: [
          "PNG supports transparency, but a PDF page does not have any: it is white paper by definition. Pages are therefore rendered on white in both formats, which is what makes them readable when dropped onto a dark slide.",
        ],
      },
    ],
    faqs: [
      {
        q: "Why is my PNG so much bigger than the JPG?",
        a: "Because it is lossless — nothing was discarded. That is exactly why the text stayed sharp.",
      },
      {
        q: "Do the images have a transparent background?",
        a: "No. Pages are rendered on white, matching how the PDF prints and keeping the result legible on any background.",
      },
      {
        q: "Which is better for printing a page?",
        a: "Either, at 300 DPI — but PNG if the page is mostly type, since JPG's compression softens the edges of small text.",
      },
    ],
    keywords: [
      "pdf to png",
      "png or jpg for documents",
      "convert pdf page to image lossless",
    ],
  },
  {
    slug: "how-to-turn-screenshots-into-a-pdf",
    tool: "png-to-pdf",
    title: "How to Turn Screenshots Into One PDF",
    h1: "How to turn screenshots into one PDF",
    description:
      "Package a folder of PNG screenshots into a single shareable document, keep them sharp, and decide between A4 pages and pages sized to each image.",
    date: "2026-08-22",
    minutes: 3,
    lead:
      "Fifteen screenshots are fifteen attachments, and nobody opens fifteen attachments in order. As one PDF they are a document — paginated, in sequence, and small enough to send.",
    sections: [
      {
        h: "Keeping them sharp",
        body: [
          "A PNG is embedded at full resolution rather than re-encoded, so a screenshot is exactly as sharp in the PDF as it is on disk. This matters most for UI captures, where re-compression is what turns crisp interface text into mush.",
          "Capture at your display's native resolution rather than scaling images down first — you can always compress the finished PDF, but you cannot put detail back.",
        ],
      },
      {
        h: "Page size and margins",
        body: [
          "Fit to image gives every page the shape of its screenshot: no white bars, no wasted space, ideal for something read on screen.",
          "A4 with a margin is right when the document will be printed or submitted somewhere expecting a standard page — a bug report, an audit trail, a claim.",
        ],
      },
      {
        h: "Ordering and naming",
        body: [
          "Screenshots are usually named by timestamp, which sorts correctly by luck rather than design. Arrange them deliberately before converting, especially where the sequence is the point — a reproduction path, a set of steps, a before and after.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is transparency preserved?",
        a: "Transparent areas render as white, because a PDF page has no transparency behind it. Flatten the image onto the background you want first if that matters.",
      },
      {
        q: "Can I mix PNG and JPG?",
        a: "Yes — anything the browser can open goes into the same document, in whatever order you arrange it.",
      },
      {
        q: "How do I make the file smaller?",
        a: "Convert first, then compress the finished PDF. One pass over the whole document beats shrinking each image separately.",
      },
    ],
    keywords: [
      "screenshots to pdf",
      "png to pdf free",
      "combine screenshots into one document",
    ],
  },
  {
    slug: "how-to-watermark-a-pdf",
    tool: "watermark-pdf",
    title: "How to Watermark a PDF (and What It Is Not)",
    h1: "How to watermark a PDF",
    description:
      "Stamp DRAFT or CONFIDENTIAL across every page, choose an opacity that reads without burying the text, and understand why a watermark is a label rather than security.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "A watermark exists to stop a document being mistaken for something it is not: a draft circulated as final, an internal costing forwarded outside. It does that job well, and it does no other job at all.",
    sections: [
      {
        h: "Opacity is the whole decision",
        body: [
          "Around 15% is the working default — obvious at a glance, faint enough to read the page through. Push to 30% if the document will be printed on an office laser printer, which renders light greys weaker than a screen does.",
          "Anything above 40% starts competing with the content, and people stop reading the document instead of noticing the label.",
        ],
      },
      {
        h: "Wording that earns its place",
        body: [
          [
            "DRAFT — for anything still being negotiated.",
            "CONFIDENTIAL — for anything with a distribution limit.",
            "A name or a date — for versions in flight between reviewers, where the useful information is which copy this is.",
          ],
          "A diagonal stamp across the middle is conventional because it survives being printed, photographed and skimmed. Horizontal reads more cleanly, and gets missed more often.",
        ],
      },
      {
        h: "What a watermark is not",
        body: [
          "It is not protection. The text becomes part of the page content, so it cannot be toggled off — but anyone with a PDF editor can remove it, and a screenshot ignores it entirely.",
          "If the requirement is that a document cannot be edited, flatten it. If the requirement is that it cannot be opened, that is encryption. A watermark tells an honest reader what they are holding; it does not stop a determined one.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can the watermark be removed later?",
        a: "By you, no — it is drawn into the page. By someone with an editor, yes. Treat it as a label, not as security.",
      },
      {
        q: "Can I use a logo instead of text?",
        a: "The watermark tool stamps text. For a logo across every page, place it in the source document before exporting, or add it per page in the editor.",
      },
      {
        q: "Will it print?",
        a: "Yes, and it is worth testing at your intended opacity — light greys print weaker than they appear on screen.",
      },
    ],
    keywords: [
      "how to watermark a pdf",
      "add draft watermark to pdf",
      "confidential stamp on a document",
    ],
  },
];
