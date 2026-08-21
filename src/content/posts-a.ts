import type { Post } from "./types";

/** Organise and edit — the tools people arrive at with a job already in mind. */
export const postsA: Post[] = [
  {
    slug: "how-to-merge-pdf-files",
    tool: "merge-pdf",
    title: "How to Merge PDF Files Without Uploading Them",
    h1: "How to merge PDF files without uploading them",
    description:
      "Combine PDFs into one document in your browser, in the order you want, and understand what merging does to bookmarks, forms and file size before you send the result on.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "Merging is the most requested thing anyone does to a PDF, and it is also the one most often done on a stranger's server. It does not need to be: joining documents is a structural operation, and a browser can do it on your own machine in about a second.",
    sections: [
      {
        h: "What merging actually does",
        body: [
          "A PDF is a set of page objects plus a catalogue that says what order they come in. Merging copies the page objects out of each source file into one new catalogue. Nothing is re-rendered, re-encoded or compressed along the way.",
          "That is why a merged file is roughly the sum of its inputs, and why the text in it is still selectable afterwards. If a merge tool hands you back something visibly softer, or a file that has become one long image, it rasterised your pages instead of copying them — which is a different operation with different consequences.",
        ],
      },
      {
        h: "Getting the order right",
        body: [
          "Order is set before the merge, not after. Add the documents, arrange them, then combine — the sequence you see is the sequence you get, and page one of the second file lands immediately after the last page of the first.",
          "Two habits save the most time here:",
          [
            "Name files so they sort the way you want them merged — 01-cover, 02-proposal, 03-annexure.",
            "Merge the covering letter last if you are unsure, then move it with the organise tool, which is faster than starting the merge again.",
            "Check the join by looking at the page count before you send: a missing annexure is much easier to spot as a number than by scrolling.",
          ],
        ],
      },
      {
        h: "What does not survive a merge",
        body: [
          "Page content survives exactly. Document-level structure does not always: bookmarks, form fields and internal links belong to the file that held them, and when pages are copied into a fresh document those references have nothing to point at.",
          "For most work — a tender pack, a set of invoices, a contract with its annexures — this does not matter. If it does, merge last: fill the form, flatten it, and then combine, so what you are joining is a finished page rather than an interactive one.",
        ],
      },
      {
        h: "Why the upload step is worth avoiding",
        body: [
          "The documents people merge are exactly the ones they should not be uploading: signed agreements, bank statements, medical records, a passport scan and a utility bill going to a landlord. Most online tools take the file, process it on a server and promise to delete it in an hour.",
          "Doing it in the browser removes the question. Your file is read from disk by the page you already have open, worked on in memory, and handed back as a download. You can prove it: load the tool, turn off your Wi-Fi, and merge anyway.",
        ],
      },
      {
        h: "When merging is the wrong tool",
        body: [
          "If you are combining photos rather than documents, convert them to a PDF first — one image per page, sized to A4 — rather than merging twenty single-page files. And if the reason you are merging is that a portal will only take one attachment under 2 MB, merge first and compress second, in that order: compressing each part separately gives you a worse result than compressing the finished document once.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many PDFs can I merge at once?",
        a: "There is no fixed limit, because there is no server enforcing one. The ceiling is your device's memory — a few hundred megabytes of documents is comfortable on an ordinary laptop, and far more than most people ever combine.",
      },
      {
        q: "Can I merge a password-protected PDF?",
        a: "Not while it is encrypted: its pages cannot be read until it is opened. Remove the password first with the unlock tool, then merge the result.",
      },
      {
        q: "Does merging reduce quality?",
        a: "No. Pages are copied rather than re-rendered, so images keep their original resolution and text stays as text. The only thing that changes is which document the pages live in.",
      },
    ],
    keywords: [
      "how to merge pdf files",
      "combine pdf without uploading",
      "merge pdf free",
      "join pdf files offline",
    ],
  },
  {
    slug: "how-to-split-a-pdf",
    tool: "split-pdf",
    title: "How to Split a PDF Into Separate Files",
    h1: "How to split a PDF into separate files",
    description:
      "Break a long PDF into single pages or custom ranges, learn how to write the ranges properly, and see why splitting is the fix for a scan holding a dozen documents.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "Splitting comes up whenever a scanner has been fed a stack of paper: one PDF arrives holding twelve invoices, and every one of them has to go somewhere different. The work is not the splitting, it is describing where the cuts go.",
    sections: [
      {
        h: "Two ways to cut a document",
        body: [
          "Fixed chunks are for documents with a rhythm. Every one page gives you each page as its own file; every two pages suits double-sided scans; every ten suits a bound report being handed to ten people.",
          "Ranges are for documents without one. When pages 1–3 are an invoice, page 4 is a delivery note and 5 to the end is a contract, you write those boundaries out and get three files.",
        ],
      },
      {
        h: "Writing ranges that do what you meant",
        body: [
          "Ranges are written the way you would say them: a hyphen for a span, a semicolon between output files.",
          [
            "1-3; 4; 5-last produces three PDFs.",
            "An open-ended range like 10- runs to the end of the document.",
            "first and last work as words, which saves counting to the end of a long scan.",
          ],
          "Everything you do not name is left out of the output entirely. That is the useful part: a split is also the fastest way to pull three sections out of a long document and discard the rest.",
        ],
      },
      {
        h: "Why the result arrives as a zip",
        body: [
          "A split usually produces several files, and browsers deliberately block a page from triggering a dozen downloads at once. Packaging them into one archive is the way around it, and the archive is built on your machine like everything else. When a split produces exactly one file, you get that PDF directly instead.",
        ],
      },
      {
        h: "Splitting a scan of mixed paperwork",
        body: [
          "The common case is a single scan holding unrelated documents. The efficient order is: split into ranges, then rename the pieces as you save them, then compress anything going to a portal.",
          "If you are not sure where the boundaries fall, open the PDF first and note the page numbers — reading the document once is faster than splitting it three times.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I split a PDF into two halves?",
        a: "Write two ranges: 1-10; 11-last for a twenty-page document, or use fixed chunks of ten. Either produces the same two files.",
      },
      {
        q: "Will splitting change the pages?",
        a: "No. Each output holds the original page objects, copied across unchanged, so text stays selectable and images keep their resolution.",
      },
      {
        q: "What happens to bookmarks in the split files?",
        a: "They are not carried into the new documents, because the pages are copied into fresh files that have no outline of their own. Page content itself is untouched.",
      },
    ],
    keywords: [
      "how to split a pdf",
      "split pdf into separate files",
      "extract pages from a scan",
      "split pdf by page range",
    ],
  },
  {
    slug: "how-to-compress-a-pdf-for-email",
    tool: "compress-pdf",
    title: "How to Compress a PDF to Fit an Email Limit",
    h1: "How to compress a PDF to fit an email limit",
    description:
      "Why scanned PDFs are enormous, what compression actually trades away, which quality level to pick, and what to do when a text-only PDF refuses to get smaller.",
    date: "2026-08-22",
    minutes: 6,
    lead:
      "Almost every compression request starts the same way: a portal caps uploads at 2 MB, or a mail server bounces at 25 MB, and the document is a scan of eleven pages that somehow weighs 40. Understanding why tells you which setting to reach for.",
    sections: [
      {
        h: "Why scans are so much larger than documents",
        body: [
          "A PDF exported from a word processor stores text as instructions: this font, this size, these characters, at these positions. A page of it is a few kilobytes.",
          "A scan stores a photograph of a page. At 300 DPI an A4 sheet is roughly 8.7 million pixels, and a scanner that saves it without much compression produces several megabytes per page. Nothing is wrong with the file — it is simply eleven photographs in a wrapper.",
        ],
      },
      {
        h: "What compression trades away",
        body: [
          "Rebuilding each page as an optimised image is what makes a scanned document drop by 60–90%. The trade is the text layer: after compression the page looks the same but is no longer searchable, because what used to be text is now part of the picture.",
          "That is the right trade for a scan, which never had a text layer to begin with. It is the wrong trade for a report you may need to search later — so keep the original, and treat the compressed copy as something you send rather than something you archive.",
        ],
      },
      {
        h: "Choosing a level",
        body: [
          [
            "Medium for anything being read on a screen. This is the setting that clears most upload limits without anyone noticing.",
            "High when the document will be printed, or when small type has to stay crisp.",
            "Low only when you are up against a hard cap and legibility is all that matters.",
          ],
          "Greyscale is the underrated option. A colour scan of black text carries three channels to describe grey paper; dropping them can take a chunk off the size before quality is touched at all, and it is the right answer for anything heading to an office printer anyway.",
        ],
      },
      {
        h: "When compression makes the file bigger",
        body: [
          "It happens, and it is not a fault. A PDF that is only text is already about as small as it can be — a handful of kilobytes of instructions. Turning those pages into images replaces a few kilobytes of text with a few hundred kilobytes of picture.",
          "If a text-only PDF is too large for a limit, the size is almost always coming from something else: an embedded font set, a full-page background, or a logo saved at print resolution on every page. Look there rather than compressing harder.",
        ],
      },
      {
        h: "The order that gets the best result",
        body: [
          "Merge first, compress second. Compressing three files separately and then joining them gives a larger document than joining them and compressing once, because the second approach optimises the whole thing against one budget.",
          "Crop before compressing if a scanner has left a black border — you are otherwise spending bytes describing the edge of the scanner lid.",
        ],
      },
    ],
    faqs: [
      {
        q: "How small can I get a PDF?",
        a: "Scans routinely drop by 60–90%. There is no fixed target: the honest way to hit a limit is to try medium first, check the result, and only drop to low if it is still too big.",
      },
      {
        q: "Will the text still be searchable?",
        a: "No — compression re-renders each page as an image, which is exactly what produces the saving. Keep your original if you need to search or copy from it.",
      },
      {
        q: "Is compressing a PDF safe for confidential documents?",
        a: "Here, yes, because the file never leaves your machine. That is worth caring about: the documents people compress are usually the ones with bank details or signatures on them.",
      },
    ],
    keywords: [
      "how to compress a pdf",
      "reduce pdf file size for email",
      "compress pdf to 2mb",
      "shrink scanned pdf",
    ],
  },
  {
    slug: "how-to-edit-a-pdf-without-acrobat",
    tool: "edit-pdf",
    title: "How to Edit a PDF Without Acrobat",
    h1: "How to edit a PDF without Acrobat",
    description:
      "What a PDF editor can and cannot change, how to add text, sign and highlight in a browser, and why editing on top of the page beats flattening it to images.",
    date: "2026-08-22",
    minutes: 6,
    lead:
      "Editing a PDF is the one thing everybody assumes needs paid software, and the assumption is half right: rewriting a paragraph does need the source document. Almost everything people actually want — a date, a signature, a highlighted clause, a logo — is adding to a page rather than rewriting it.",
    sections: [
      {
        h: "Why you cannot just retype a paragraph",
        body: [
          "A PDF does not store paragraphs. It stores glyphs with coordinates: this character, in this font, at this exact position on the page. There is no concept of a line that can reflow, because the format's entire purpose is that the page looks identical everywhere.",
          "That is why every editor, paid ones included, is really doing one of two things: covering something and drawing over it, or reconstructing an approximation of the text and hoping the reflow is close. Knowing which you are looking at saves a lot of frustration.",
        ],
      },
      {
        h: "What you can do straight away",
        body: [
          [
            "Type on the page — a date, a reference number, a name in a blank on a form.",
            "Sign by hand, drawing with a trackpad, mouse or finger.",
            "Highlight a clause so the person reading it knows which one you mean.",
            "Drop in an image — a logo, a stamp, or a signature you already have saved as a PNG.",
          ],
          "Those four cover the overwhelming majority of real edits. What they have in common is that they add content rather than rewriting it, which is why they are fast and lossless.",
        ],
      },
      {
        h: "Adding to a page instead of flattening it",
        body: [
          "There are two ways to save an edited PDF. The lazy one renders every page to an image and writes the images back — simple to build, and it destroys the document: text stops being selectable, file size balloons, and print quality drops.",
          "The better one writes your additions into the page as new content, leaving the original objects alone. The existing text stays searchable, images keep their resolution, and the file grows by roughly the size of what you added. It is worth checking which one a tool does before you use it on anything that matters.",
        ],
      },
      {
        h: "Signing a document properly",
        body: [
          "A drawn signature is legally an electronic signature in most jurisdictions, and it is what the majority of everyday agreements actually need. Draw it at a comfortable size and place it over the line rather than on it.",
          "If you need a signature that carries a certificate and detects later tampering — a digital signature in the strict sense — that is a different mechanism, and it needs a certificate authority rather than a drawing tool. Most invoices, NDAs and consent forms do not.",
        ],
      },
      {
        h: "The one habit worth adopting",
        body: [
          "Flatten the file after you fill a form. A completed form is still interactive, which means the next person to open it can change your answers, or clear them by accident. Flattening bakes the values into the page so what you sent is what they see.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I remove text that is already in the PDF?",
        a: "Not by editing it as text. The practical approach is to cover it — a white rectangle or an image — and type the replacement over the top, which is what most editors do underneath anyway.",
      },
      {
        q: "Is a drawn signature legally valid?",
        a: "In most places a drawn mark is a valid electronic signature for ordinary agreements, and it is what the majority of contracts get signed with. Anything requiring a certified digital signature needs a certificate, not a drawing.",
      },
      {
        q: "Does editing in a browser mean my document is uploaded?",
        a: "It does not have to. Here the pages are rendered and the file is rewritten inside the tab, which is precisely why a contract or a bank statement is safe to open — turn off your Wi-Fi and the editor keeps working.",
      },
    ],
    keywords: [
      "how to edit a pdf",
      "edit pdf without acrobat",
      "add text to a pdf",
      "sign a pdf online free",
    ],
  },
  {
    slug: "how-to-rotate-a-pdf-and-make-it-stick",
    tool: "rotate-pdf",
    title: "How to Rotate a PDF So the Rotation Sticks",
    h1: "How to rotate a PDF so the rotation sticks",
    description:
      "Why a rotation disappears when you close the file, the difference between rotating the view and rotating the document, and how to fix only the pages that are sideways.",
    date: "2026-08-22",
    minutes: 3,
    lead:
      "Everybody has rotated a PDF, saved it, reopened it and found it sideways again. That is not a bug in the reader — it is two different operations that look identical on screen.",
    sections: [
      {
        h: "Rotating the view versus rotating the document",
        body: [
          "Most PDF readers rotate what you are looking at. It is a display setting, it lives in the reader, and it is forgotten the moment the file is closed — or the moment the file is opened by anybody else.",
          "Rotating the document changes a value stored on the page itself, inside the file. Every reader honours it, printers honour it, and it survives being emailed. That is what you want when a scan came in sideways.",
        ],
      },
      {
        h: "Fixing only the pages that are wrong",
        body: [
          "Scans are rarely uniformly wrong. A twenty-page document with three landscape tables usually needs those three turned and nothing else.",
          "Naming pages — 2, 5-9 — turns exactly those and leaves the rest alone. Leaving the selection empty turns everything, which is the right answer for a document that came off the scanner the wrong way round as a whole.",
        ],
      },
      {
        h: "It costs nothing in quality",
        body: [
          "Rotation is a number on a page object, not a transformation of its contents. Nothing is re-rendered, the file size does not change, and text stays selectable. Rotating four times returns you exactly where you started, byte for byte.",
        ],
      },
      {
        h: "Sideways versus upside down",
        body: [
          "If the page is 90° out, the fix is one turn in the right direction and it is obvious which. If it is 180° out — common when a sheet feeder pulls a stack the wrong way — every page usually needs the same 180° turn, and it is worth checking whether the pages are also in reverse order while you are there.",
        ],
      },
    ],
    faqs: [
      {
        q: "Why does my rotation keep disappearing?",
        a: "Because the reader rotated its own view rather than the file. Writing the rotation into the document itself is what makes it persist for everyone who opens it.",
      },
      {
        q: "Can I rotate one page in a large document?",
        a: "Yes — name that page number and the rest of the document is untouched.",
      },
      {
        q: "Does rotating make the file bigger?",
        a: "No. It changes a rotation value on each page you selected, so the file comes back essentially the same size it went in.",
      },
    ],
    keywords: [
      "how to rotate a pdf",
      "rotate pdf and save permanently",
      "pdf keeps rotating back",
      "rotate one page in a pdf",
    ],
  },
];
