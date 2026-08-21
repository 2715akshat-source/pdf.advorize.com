import type { Post } from "./types";

/** Preparing a document to be sent, printed or reused. */
export const postsD: Post[] = [
  {
    slug: "how-to-crop-pdf-margins",
    tool: "crop-pdf",
    title: "How to Crop the Margins of a PDF",
    h1: "How to crop the margins of a PDF",
    description:
      "Trim a scanner's black edge or excess white space off every page, understand PDF points, and know why cropping does not make the file smaller.",
    date: "2026-08-22",
    minutes: 3,
    lead:
      "Two things send people looking for a crop: a scanner that captured the lid as a black border, and a document being read on a small screen where the margins are eating half the display.",
    sections: [
      {
        h: "Points, not pixels",
        body: [
          "PDF measurements are in points: 1/72 of an inch. An A4 page is 595 × 842 points, so 72 trims an inch and about 28 trims a centimetre.",
          "Start conservatively. Two passes of 20 points each is quicker than one pass of 60 that clipped a footer you needed.",
        ],
      },
      {
        h: "Cropping hides, it does not delete",
        body: [
          "A crop sets the visible box on the page; the trimmed area is still in the file, just not displayed. That makes it fully reversible — and it means the document does not get smaller.",
          "It also means a crop is not a redaction. If something is in the margin you do not want seen, crop and then flatten, so what remains is a rendered page rather than hidden content.",
        ],
      },
      {
        h: "Different pages, different margins",
        body: [
          "One crop applies to every page. Where a document genuinely needs different trims — a landscape table in a portrait report — split it, crop each part, then merge the pieces back together.",
        ],
      },
    ],
    faqs: [
      {
        q: "Will cropping reduce the file size?",
        a: "No. The content is hidden rather than removed, which is also why the crop can be undone.",
      },
      {
        q: "How much should I trim?",
        a: "Start with 20–30 points a side and look at the result. Scanner borders are usually 20–60 points; document margins are often 50–70.",
      },
      {
        q: "Can I crop a single page?",
        a: "Not in one pass — split the document, crop that part, and merge it back.",
      },
    ],
    keywords: [
      "how to crop a pdf",
      "trim pdf margins",
      "remove scanner black border",
    ],
  },
  {
    slug: "how-to-flatten-a-pdf-form",
    tool: "flatten-pdf",
    title: "How to Flatten a PDF Form Before You Send It",
    h1: "How to flatten a PDF form before you send it",
    description:
      "Why a filled form is still editable, what flattening actually does to fields and annotations, and when flattening is the wrong answer.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "You fill in a form, save it, email it — and the person at the other end can change your answers, or wipe them by clicking the wrong thing. A filled PDF form is not a finished document; it is a document with your answers sitting in editable boxes on top.",
    sections: [
      {
        h: "What flattening does",
        body: [
          "Each page is rendered exactly as it appears — field values, comments, annotations and all — and that rendering becomes the page. The interactive layer stops existing, so there is nothing left to edit or clear.",
          "It is the digital equivalent of printing the completed form and scanning it back in, without the print and the scan.",
        ],
      },
      {
        h: "When it is the right call",
        body: [
          [
            "Any form going to a third party — an application, a claim, an onboarding pack.",
            "Anything signed, so the signature cannot be dragged or deleted.",
            "Documents with review comments you want visible but no longer editable.",
          ],
        ],
      },
      {
        h: "What you give up",
        body: [
          "The text layer. Flattening converts pages to images, so the result is not searchable and cannot be copied from. Keep the original if you might need either — and remember that this is what makes the file larger, not smaller.",
          "It is also not encryption. A flattened PDF opens for anyone; it just cannot have its fields edited.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a flattened PDF the same as a protected one?",
        a: "No. Flattening stops casual editing of fields and comments. It does not stop anyone opening the file, and it is not a password.",
      },
      {
        q: "Will the text still be searchable?",
        a: "No — pages become images. Keep your original if you need to search or copy from it.",
      },
      {
        q: "Does flattening make the file bigger?",
        a: "Usually, yes, because rendered pages are images. Compressing afterwards brings it back down if size matters.",
      },
    ],
    keywords: [
      "how to flatten a pdf",
      "lock pdf form fields",
      "make a pdf non editable",
    ],
  },
  {
    slug: "how-to-convert-a-pdf-to-greyscale",
    tool: "grayscale-pdf",
    title: "How to Convert a PDF to Greyscale for Printing",
    h1: "How to convert a PDF to greyscale for printing",
    description:
      "Why a print shop charges colour rates for a nearly-black document, how greyscale conversion changes the file rather than the print settings, and what it does to size.",
    date: "2026-08-22",
    minutes: 3,
    lead:
      "Print shops bill by the colour page, and a page counts as colour if there is a single tinted pixel on it. One logo per slide turns an eighty-page deck into an eighty-page colour job.",
    sections: [
      {
        h: "Changing the file, not the print dialogue",
        body: [
          "Printing in black and white is a setting on the printer, which the print shop's counter does not see and the next person to open the file does not inherit. Converting the document makes it greyscale wherever it goes.",
          "That is the difference worth understanding: one is an instruction to a machine, the other is a property of the document.",
        ],
      },
      {
        h: "What it does to size",
        body: [
          "Colour information is discarded and pages are re-encoded, so image-heavy documents often shrink noticeably. Text-only files may barely change, because there was little colour data to remove.",
          "The trade is the same one compression makes: pages are re-rendered, so the text layer does not survive. Keep the original.",
        ],
      },
      {
        h: "Check the contrast before you commit",
        body: [
          "Colours that are clearly distinct in a chart can converge into the same grey. A legend with red and green lines becomes two identical grey lines. Look at any chart in the converted file before sending it to print — and if it fails, fix the source document's colours rather than the PDF.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I get the colour back?",
        a: "Not from the converted file — the colour is gone. Keep your original.",
      },
      {
        q: "Is greyscale the same as black and white?",
        a: "No. Greyscale keeps the full range of greys, which is what photographs need. True black and white is one bit per pixel and suits line art only.",
      },
      {
        q: "Will this make my file smaller?",
        a: "Usually, for anything with images or colour backgrounds. A plain text document will not change much.",
      },
    ],
    keywords: [
      "convert pdf to greyscale",
      "black and white pdf for printing",
      "reduce colour printing cost",
    ],
  },
  {
    slug: "how-to-extract-text-from-a-pdf",
    tool: "pdf-to-text",
    title: "How to Extract Text From a PDF",
    h1: "How to extract text from a PDF",
    description:
      "Get clean text out of a PDF without the broken line breaks, understand why a scan comes back empty, and know what OCR would add.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "Copying out of a PDF reader gives you text with line breaks in the wrong places, hyphens mid-word and columns interleaved. That is not the reader being careless — it is what happens when you ask for a rectangle of positioned glyphs and expect prose.",
    sections: [
      {
        h: "Why copy and paste goes wrong",
        body: [
          "A PDF stores each run of characters with coordinates. There is no paragraph, no reading order beyond convention, and no line that knows it continues below. Reconstructing sentences means inferring them from positions.",
          "Walking the text layer page by page and rebuilding lines from vertical positions gets you far closer to readable prose than a selection drag does.",
        ],
      },
      {
        h: "When the file comes back empty",
        body: [
          "It is a scan. A scanned page is a picture of text with no text layer to read, so there is genuinely nothing to extract.",
          "Turning that picture into text needs OCR — optical character recognition — which is a different operation: it recognises shapes as characters and always involves some error rate. If you need it, that is what to search for; extraction cannot substitute.",
        ],
      },
      {
        h: "What extraction preserves",
        body: [
          [
            "Reading order and line breaks — reconstructed, and usually right.",
            "Non-Latin scripts — the text comes out in whatever the PDF stored and is written as UTF-8, so Hindi, Bengali and Arabic extract correctly.",
            "What it does not preserve: columns, tables and exact spacing. It is text for reuse, not a visual copy.",
          ],
        ],
      },
    ],
    faqs: [
      {
        q: "Why did I get an empty text file?",
        a: "Your PDF is a scan — an image of text with no text layer. Extracting that needs OCR, which this does not do.",
      },
      {
        q: "Will tables come out correctly?",
        a: "Not as tables. You get the cell contents in reading order, without the grid. For real tabular data, extract and then rebuild the columns.",
      },
      {
        q: "Does it work with other languages?",
        a: "Yes. The output is UTF-8, so any script the PDF stores as text extracts properly.",
      },
    ],
    keywords: [
      "extract text from a pdf",
      "pdf to txt",
      "copy text out of a pdf properly",
    ],
  },
  {
    slug: "what-metadata-your-pdf-is-carrying",
    tool: "edit-pdf-metadata",
    title: "What Metadata Your PDF Is Carrying",
    h1: "What metadata your PDF is carrying",
    description:
      "The hidden document properties every PDF holds, where they show up, why an exported file often names someone else, and how to clear them before you send it.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "Every PDF carries a small set of properties that nobody looks at until they cause a problem: a title from the template it was built on, an author who left the company two years ago, a producer string naming software you would rather not advertise.",
    sections: [
      {
        h: "Where it shows up",
        body: [
          [
            "The document properties panel of every PDF reader.",
            "File listings and search results on the recipient's own machine.",
            "Search engines, when the PDF is published on a website — the title field often becomes the result heading rather than anything on the page.",
          ],
          "That last one is why a stale title is worth fixing on anything public: a brochure indexed as 'Untitled-3' is a wasted result.",
        ],
      },
      {
        h: "Why the author is usually wrong",
        body: [
          "Metadata is inherited. A proposal built from last year's proposal carries last year's author, and an export from a design file carries whoever created the template. Nobody is doing anything careless; the field simply travels with the document until someone changes it.",
        ],
      },
      {
        h: "Clearing it before a document goes out",
        body: [
          "Stripping the properties is one action and worth building into the habit for anything sent outside the organisation. But be clear about what it achieves: it clears the standard document fields, and it does nothing to the content.",
          "A letterhead, a signature, tracked text or a name in a footer are all still there. If anonymity is the goal, review the pages too — and consider flattening, which removes the annotation layer that comments hide in.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does removing metadata make a document anonymous?",
        a: "No. It clears the document properties. Anything visible on the pages, and anything in annotations, is untouched.",
      },
      {
        q: "Can I change just the title?",
        a: "Yes — empty fields are left alone, so you can set one property without touching the rest.",
      },
      {
        q: "Does metadata affect SEO?",
        a: "For a PDF published on a website, the title field often becomes the heading of the search result, so it is worth setting deliberately.",
      },
    ],
    keywords: [
      "pdf metadata",
      "change pdf author",
      "remove pdf document properties",
    ],
  },
];
