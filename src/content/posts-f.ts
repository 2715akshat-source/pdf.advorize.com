import type { Post } from "./types";

/** Conversion, editing and the questions people ask an answer engine. */
export const postsF: Post[] = [
  {
    slug: "pdf-to-word-what-actually-works",
    tool: "pdf-to-text",
    title: "PDF to Word: What Actually Works, and What Does Not",
    h1: "PDF to Word: what actually works",
    description:
      "Why PDF to Word conversion produces broken layouts, when it is worth doing anyway, and the two approaches that work better than a converter for getting text out of a PDF.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "PDF to Word is one of the most searched conversions there is, and one of the most disappointing. The reason is not that the tools are bad — it is that the two formats disagree about what a document is.",
    sections: [
      {
        h: "Why the conversion is hard",
        body: [
          "A Word document is a flow: paragraphs, styles and rules about how text reflows when something changes. A PDF is a fixed page: glyphs at coordinates, chosen so the page looks identical everywhere.",
          "Converting the second into the first means guessing at structure that was thrown away. Where the guess works, you get a clean document. Where it does not, you get text boxes stacked on each other, tables that are not tables, and paragraph breaks in the middle of sentences.",
        ],
      },
      {
        h: "When it works well",
        body: [
          [
            "Single-column text with clear headings and no tables — a letter, an article, a policy document.",
            "PDFs exported from Word in the first place, where the structure was simple to begin with.",
          ],
          "It works badly on multi-column layouts, anything designed rather than typed, forms, and every scan — a scan has no text at all to convert, only a picture of one.",
        ],
      },
      {
        h: "What to do instead",
        body: [
          "There are two better routes, depending on what you actually need.",
          "If you need the words — to quote, edit or reuse — extract the text and paste it into a fresh document. You lose the layout, which the conversion would have mangled anyway, and you get clean text in seconds.",
          "If you need the layout, find the source. Somebody has the original file, and thirty seconds of asking beats an hour of repairing a conversion.",
        ],
      },
      {
        h: "If the PDF is a scan",
        body: [
          "No converter can extract text that is not there. A scanned page is an image, and turning it into text requires OCR — a recognition step with its own error rate, particularly on handwriting, poor scans and non-Latin scripts.",
          "OCR needs real processing and a trained model, which is why a browser-based tool cannot honestly offer it. If your document is a scan and you need the text, that is what to go looking for.",
        ],
      },
    ],
    faqs: [
      {
        q: "Why does my converted Word file look broken?",
        a: "Because the PDF never stored paragraphs — it stored glyph positions. The converter has to infer structure that was discarded when the PDF was made, and complex layouts defeat the inference.",
      },
      {
        q: "How do I get text out of a PDF without a converter?",
        a: "Extract the text layer to a plain .txt file and paste it where you need it. You lose the formatting, but you get accurate text immediately.",
      },
      {
        q: "Can I convert a scanned PDF to Word?",
        a: "Only with OCR, which recognises shapes as characters and always introduces some errors. Without it there is no text in the file to convert.",
      },
    ],
    keywords: [
      "pdf to word",
      "convert pdf to editable text",
      "why pdf to word looks broken",
      "extract text from pdf instead of converting",
    ],
  },
  {
    slug: "how-to-fill-a-pdf-form",
    tool: "edit-pdf",
    title: "How to Fill In a PDF Form and Send It Properly",
    h1: "How to fill in a PDF form and send it properly",
    description:
      "Fill a form whether or not it has real fields, sign it, and flatten it so nobody can change your answers — plus why printing and rescanning is worth avoiding.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "There are two kinds of PDF form, they look identical, and which one you have decides how you fill it. The clue is whether clicking on a blank puts a cursor in it.",
    sections: [
      {
        h: "Interactive forms and flat ones",
        body: [
          "An interactive form has real fields built into the file. Click and type, tab between them, and the values are stored as data on the document.",
          "A flat form is a picture of a form — usually a scan, or an export that lost its fields. Clicking does nothing, because there is nothing there. This is the kind most people hit, and the kind that sends them looking for a printer.",
        ],
      },
      {
        h: "Filling a flat form without printing it",
        body: [
          "You do not need the fields. Type directly onto the page where the fields would have been, place a signature, and save.",
          [
            "Set the text size to match the printed labels — a size that looks right beside the form's own type reads as filled in rather than annotated.",
            "Place text on the line rather than through it.",
            "Sign by drawing, or drop in a signature image if you keep one.",
          ],
          "Printing, filling by hand, scanning and emailing produces a worse-looking document, a much larger file, and takes ten times as long.",
        ],
      },
      {
        h: "Flatten before you send",
        body: [
          "This is the step people miss. A filled interactive form is still interactive: the recipient can edit your answers, and can clear the whole form with one wrong click.",
          "Flattening renders the values into the page so they become part of it. What you sent is what they see, and neither of you can change it by accident.",
        ],
      },
      {
        h: "Before it goes",
        body: [
          [
            "Read it back at 100% — a date in the wrong box is easy to miss while typing and obvious afterwards.",
            "Check the file size if a portal is involved, and compress at the end rather than the beginning.",
            "Keep an unflattened copy for yourself if you may need to correct something later.",
          ],
        ],
      },
    ],
    faqs: [
      {
        q: "How do I fill in a PDF that has no fields?",
        a: "Type straight onto the page in an editor. The form's fields are only lines printed on a picture, so text placed where they are looks exactly like a completed form.",
      },
      {
        q: "Why should I flatten a completed form?",
        a: "Because field values stay editable until you do. Flattening makes your answers part of the page, so nobody can change or clear them after you send it.",
      },
      {
        q: "Is it better to print, sign and scan?",
        a: "Almost never. It produces a larger, uglier file and adds a scanner to a process that did not need one. Signing on screen is faster and legally sufficient for ordinary agreements.",
      },
    ],
    keywords: [
      "how to fill a pdf form",
      "fill pdf form without fields",
      "type on a pdf",
      "flatten pdf after filling",
    ],
  },
  {
    slug: "how-to-reduce-pdf-size-without-losing-quality",
    tool: "compress-pdf",
    title: "How to Reduce PDF Size Without Losing Quality",
    h1: "How to reduce PDF size without losing quality",
    description:
      "Which savings are genuinely free, which cost you something, and how to find out why a PDF is large before you compress it — including the cases where compression is the wrong tool.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "\"Without losing quality\" is doing a lot of work in that phrase. Some savings genuinely cost nothing; others trade something you may not notice until it matters. It is worth knowing which is which before you press the button.",
    sections: [
      {
        h: "The savings that are actually free",
        body: [
          [
            "Removing pages you do not need. The largest saving available, and it costs nothing at all.",
            "Cropping a scanner border. Bytes describing the edge of a scanner lid buy you nothing.",
            "Deleting blank backs from a duplex scan. Half the pages of many scanned documents are empty.",
            "Greyscale on a black-and-white document. There is no colour to lose.",
          ],
          "Do all four before compressing. People habitually reach for the compressor first and then wonder why the result looks soft.",
        ],
      },
      {
        h: "The saving that costs you something",
        body: [
          "Re-rendering pages as optimised images is what produces the dramatic reductions on scans — and it replaces the text layer with a picture of text. The page looks the same; it is no longer searchable, and text cannot be copied out of it.",
          "For a scan that never had a text layer, this costs nothing real. For a report you may need to search later, keep the original and treat the compressed copy as the one you send.",
        ],
      },
      {
        h: "Find out why it is large first",
        body: [
          "Divide the file size by the page count. A few kilobytes a page is a text document; a megabyte or more a page is a scan or an image-heavy design.",
          "That number tells you which problem you have. Compression is transformative on the second and nearly useless on the first — where a large file usually means embedded fonts, a full-page background, or a print-resolution logo repeated on every page.",
        ],
      },
      {
        h: "When compression is the wrong tool",
        body: [
          [
            "The file is a text document already — look at what is embedded instead.",
            "The document has to stay searchable — split it, or send it as a link.",
            "You have already compressed it once — a second pass loses clarity and saves almost nothing.",
            "The limit is per file and the document is genuinely long — split it and send it in parts.",
          ],
        ],
      },
    ],
    faqs: [
      {
        q: "Can a PDF be compressed with no loss at all?",
        a: "Only through the structural savings — removing pages, cropping, dropping colour that carries no information. Anything that re-renders the page trades the text layer for size, however good it looks.",
      },
      {
        q: "Why did compressing make my file bigger?",
        a: "Your PDF was text, not images. A few kilobytes of drawing instructions were replaced by a few hundred kilobytes of picture. Look at what is embedded in it instead.",
      },
      {
        q: "How much can I expect to save?",
        a: "Scans and image-heavy documents commonly drop 60–90%. Text documents barely move, because they were never large for the reason you assumed.",
      },
    ],
    keywords: [
      "reduce pdf size without losing quality",
      "compress pdf lossless",
      "why is my pdf so large",
      "pdf compression explained",
    ],
  },
  {
    slug: "pdf-page-numbers-bates-and-tenders",
    tool: "add-page-numbers",
    title: "Numbering a Tender or Legal Pack Properly",
    h1: "Numbering a tender or legal pack properly",
    description:
      "How to number an assembled document set so it can be referred to, when Page x of y matters, and why numbering after merging beats numbering the source files.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "In a tender, a court bundle or a due-diligence pack, page numbers are not decoration. They are the addressing system everyone in the room uses, and getting them wrong wastes other people's time in a way that is remembered.",
    sections: [
      {
        h: "Number the pack, not the parts",
        body: [
          "Each source document is numbered correctly on its own, which is exactly the problem: assembled, the sequence restarts at every section and page 4 exists five times.",
          "Numbering the assembled document gives every page one unambiguous address. It also survives further changes — add an annexure, renumber the pack, and the addressing stays consistent.",
        ],
      },
      {
        h: "When Page x of y earns its place",
        body: [
          "For anything printed and handed round — tenders, bundles, board papers — Page 3 of 47 makes a missing sheet obvious at a glance. A bare number does not.",
          "For a document that stays on screen, the total adds clutter for no benefit. Choose by how the document will be used, not by habit.",
        ],
      },
      {
        h: "Covers, annexures and continuing sequences",
        body: [
          [
            "Skip the cover. A cover page is not page one, and numbering it looks careless.",
            "Start from a number when the document continues something else — an annexure that follows page 40 of the main pack should begin at 41.",
            "Keep the position consistent across every document in a set. Mixed corners in one bundle reads as three documents stapled together, because that is what it is.",
          ],
        ],
      },
      {
        h: "The check that takes thirty seconds",
        body: [
          "Open the finished pack, jump to the last page, and confirm the number matches the page count you expect. It catches a missing annexure, a duplicated section and a numbering run that started in the wrong place — all of which are cheap to fix now and expensive to explain later.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I number before or after merging?",
        a: "After. Numbering the sources means renumbering everything each time the pack changes, and the numbers will not match what a reader sees.",
      },
      {
        q: "Where should page numbers go?",
        a: "Bottom centre is the safest default and the least likely to collide with existing content. Bottom right suits documents read in a binder. Be consistent across the whole set.",
      },
      {
        q: "Can I add numbers to a document that already has some?",
        a: "Yes, but decide which sequence is authoritative and place the new numbers where they will not be confused with the old — a different corner, and consistent throughout.",
      },
    ],
    keywords: [
      "number a tender document",
      "page numbering legal bundle",
      "page x of y pdf",
      "add page numbers after merging",
    ],
  },
  {
    slug: "how-to-redact-a-pdf-properly",
    tool: "flatten-pdf",
    title: "How to Redact a PDF Properly (Not With a Black Box)",
    h1: "How to redact a PDF properly",
    description:
      "Why a black rectangle over text hides nothing, how redactions leak in real documents, and the two methods that actually remove information from a PDF.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "Drawing a black box over a number is the most common redaction mistake, and it has embarrassed governments, law firms and newspapers. The text is still in the file. The box is a picture on top of it.",
    sections: [
      {
        h: "Why the black box fails",
        body: [
          "A PDF holds content in layers of instructions. Drawing a filled rectangle adds an instruction to paint black pixels; it does not delete the text underneath, which remains in the file exactly as it was.",
          "Anyone can select the region and copy the text out, extract the text layer, or open the file in an editor and move the rectangle. No skill is required, which is why this keeps happening publicly.",
        ],
      },
      {
        h: "The other ways redactions leak",
        body: [
          [
            "Metadata — the author, the original filename, the software that produced it.",
            "Annotations and comments, which are stored separately from the page and are easy to forget.",
            "Cropping, which hides content by changing the visible box while leaving it in the file.",
            "Earlier versions inside the same file, where incremental saves have preserved what was there before.",
          ],
        ],
      },
      {
        h: "Two methods that actually work",
        body: [
          "The first: remove the page entirely. If the sensitive content is confined to particular pages, deleting them removes it from the file rather than covering it.",
          "The second: cover, then flatten. Draw over what must go, then flatten the document so every page is re-rendered as an image. The text underneath is not hidden — it no longer exists in the output, because the output is a picture of the page as it now appears.",
          "Flattening costs you the text layer for the whole document, which is the price of certainty. For anything genuinely sensitive, it is the right price.",
        ],
      },
      {
        h: "Then verify it",
        body: [
          [
            "Open the redacted file and try to select the covered text. If anything selects, you have not redacted it.",
            "Extract the text layer and search it for what should be gone.",
            "Check the metadata, and strip it.",
            "Compare the page count against the original.",
          ],
          "Verification takes a minute. Discovering a failed redaction after distribution cannot be undone — the document is already out.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is drawing a black box over text enough?",
        a: "No. The text stays in the file underneath and can be selected, copied or extracted by anybody. This is the single most common cause of leaked redactions.",
      },
      {
        q: "What is the safest way to redact a PDF?",
        a: "Delete the page if the content is confined to it. Otherwise cover the content and flatten the document, so the output is a rendered image of the page and the original text is not carried into it.",
      },
      {
        q: "Does redaction remove metadata too?",
        a: "No — they are separate. Strip the document properties as well, and check annotations, which are stored apart from the page content.",
      },
    ],
    keywords: [
      "how to redact a pdf",
      "black box over text pdf not safe",
      "remove sensitive information from pdf",
      "redaction failure pdf",
    ],
  },
];
