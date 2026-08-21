import type { Post } from "./types";

/** Pages, conversion and the tools people reach for after a scan. */
export const postsB: Post[] = [
  {
    slug: "how-to-delete-pages-from-a-pdf",
    tool: "remove-pages-from-pdf",
    title: "How to Delete Pages From a PDF Safely",
    h1: "How to delete pages from a PDF",
    description:
      "Remove blank scans, cover sheets or an internal appendix from a PDF, and understand the one thing deleting pages does not do — take the content out of the file.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "Deleting pages is usually the last step before a document goes out: the internal costing sheet comes out of the proposal, the blank backs come out of the scan. It is also the step where people quietly assume more has happened than actually has.",
    sections: [
      {
        h: "Naming the pages to drop",
        body: [
          "Commas and hyphens do the work: 1, 4-6, 12 removes those and copies everything else through in its original order. The words first and last save counting, so 1, last drops a cover sheet and a back page in one pass.",
          "Your original file is never modified — the tool writes a new copy — so a wrong selection costs you nothing but the second attempt.",
        ],
      },
      {
        h: "The thing deleting does not do",
        body: [
          "Removing a page removes it from the document. It does not redact anything: if the page you deleted held a number you did not want shared, and someone has an earlier copy of the file, the deletion cannot reach it.",
          "More importantly, deleting a page is not the same as covering something on a page. Drawing a black box over a figure in an editor hides it visually while the text stays underneath, selectable by anyone who knows to try. Genuine redaction means removing the content, and the safe practical route is to delete the whole page, or to flatten the document so what is left is a picture rather than text.",
        ],
      },
      {
        h: "Blank pages from a duplex scan",
        body: [
          "Scanning double-sided paper where only one side is printed produces a document that is half empty pages. They are rarely truly blank — a faint shadow of the other side is enough that automatic blank detection misses them.",
          "The quick manual version: even-numbered pages are usually the empty ones, so 2, 4, 6-… removes them in one selection. Check the page count afterwards, which is faster than scrolling.",
        ],
      },
      {
        h: "What travels with the remaining pages",
        body: [
          "Page content, text and images are preserved exactly. Document-level extras — bookmarks, form fields — are not carried over, because what is left is copied into a fresh document. If a form matters, fill and flatten it before trimming.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does deleting a page make the file smaller?",
        a: "Usually, yes — the page's content is not copied into the new document. A text-only page saves very little; a scanned page can save megabytes.",
      },
      {
        q: "Can I get a deleted page back?",
        a: "Not from the new file, but your original is untouched on disk, so re-run the tool with a corrected selection.",
      },
      {
        q: "Is deleting a page the same as redacting it?",
        a: "Only if the sensitive content is on the page you removed. Covering something on a page that stays in the document is not redaction — the text is still there underneath.",
      },
    ],
    keywords: [
      "how to delete pages from a pdf",
      "remove blank pages from a scan",
      "delete a page from a pdf free",
    ],
  },
  {
    slug: "how-to-convert-pdf-to-jpg",
    tool: "pdf-to-jpg",
    title: "How to Convert a PDF to JPG (and Which DPI to Use)",
    h1: "How to convert a PDF to JPG",
    description:
      "Turn PDF pages into images, choose a resolution that suits the job, and know when PNG is the better answer than JPG for pages that are mostly text.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "Converting a PDF to images is what you do when the destination will not take a PDF: a slide deck, a marketplace listing, a WhatsApp message, a CMS that only accepts pictures. The only real decision is resolution, and it is worth two minutes.",
    sections: [
      {
        h: "How a page becomes an image",
        body: [
          "The page is rendered — the same drawing operation your PDF reader performs to show it — onto a canvas at whatever size you ask for, and that canvas is saved as an image. Resolution is therefore something you choose, not something the PDF has.",
          "This is why a converted page can look sharper than a screenshot of the same document: you are asking for the page to be drawn at high resolution rather than copying pixels off a screen.",
        ],
      },
      {
        h: "Choosing DPI",
        body: [
          [
            "72 DPI — a quick preview or a thumbnail. Small files, visibly soft type.",
            "150 DPI — the default for anything read on a screen. Text is comfortable, files stay sensible.",
            "300 DPI — print, or anything that will be cropped into and zoomed. An A4 page at 300 DPI is around 8.7 million pixels, so expect large files and a slower conversion.",
          ],
          "Higher is not automatically better. A 600 DPI conversion of a page destined for a slide costs you time and megabytes for detail no one will see.",
        ],
      },
      {
        h: "JPG or PNG",
        body: [
          "JPG uses lossy compression tuned for photographs. It is the right answer for scanned pages and anything with photographic content, and it produces far smaller files.",
          "PNG is lossless and keeps hard edges clean. Pages that are mostly type, tables, diagrams or screenshots look noticeably better as PNG, because JPG's compression puts a faint fuzz around sharp black-on-white edges.",
          "The short rule: photographs and scans go to JPG, documents and diagrams go to PNG.",
        ],
      },
      {
        h: "Converting one page rather than all of them",
        body: [
          "A multi-page conversion arrives as a zip, because browsers block a page from starting a dozen downloads. If you only want page seven, extract that page first and convert the one-page file — you get a single image straight away.",
        ],
      },
    ],
    faqs: [
      {
        q: "Why did I get a zip file?",
        a: "Because the document had more than one page. Browsers will not allow a page to trigger many downloads at once, so the images are packaged into one archive — built on your machine, like the conversion itself.",
      },
      {
        q: "Can I convert a PDF to JPG without losing quality?",
        a: "Render at 300 DPI and use PNG rather than JPG if the page is mostly text. There is no fixed quality to lose — a PDF page is instructions, and you decide how finely they get drawn.",
      },
      {
        q: "How do I convert JPGs back into a PDF?",
        a: "Use the JPG to PDF tool, which fits each image to a page. Note that the round trip does not restore a text layer: once a page has become an image, the text in it is a picture of text.",
      },
    ],
    keywords: [
      "how to convert pdf to jpg",
      "pdf to image dpi",
      "convert pdf pages to pictures",
      "pdf to jpg or png",
    ],
  },
  {
    slug: "how-to-convert-photos-to-pdf",
    tool: "jpg-to-pdf",
    title: "How to Turn Photos Into a Single PDF",
    h1: "How to turn photos into a single PDF",
    description:
      "Combine phone photos or screenshots into one properly paginated PDF, choose between A4 and fitting the image, and avoid the white bars most converters leave behind.",
    date: "2026-08-22",
    minutes: 4,
    lead:
      "The reason this comes up is almost always the same: a form will only accept a PDF, and the documents in question are photographs on a phone. Sending eleven attachments is not an option, so they have to become one file.",
    sections: [
      {
        h: "One image per page, in the order you set",
        body: [
          "Each photo becomes a page, in the order you arrange them before converting. Arrange first — reordering a finished PDF is a second job, and photo filenames rarely sort the way a document should read.",
          "Mixing formats is fine. Anything the browser can open — JPG, PNG, WebP, most HEIC photos from an iPhone — can go into the same document.",
        ],
      },
      {
        h: "Page size, and where white bars come from",
        body: [
          "Fitting a 4:3 photo to an A4 page leaves space somewhere, because the two shapes do not match. That is the white space people complain about, and it is geometry rather than a fault.",
          [
            "A4 or Letter — the right answer when the PDF will be printed or submitted to a portal expecting a standard page.",
            "Fit to image — each page is sized to its own photo, so there are no bars at all. Ideal for screenshots and anything staying on screen.",
          ],
          "Margins matter for the same reason. A 24-point margin looks deliberate on A4 and stops a printer trimming the edge of a document scan.",
        ],
      },
      {
        h: "Photographing a document so it converts well",
        body: [
          [
            "Fill the frame with the page and shoot straight down — a skewed photo stays skewed in the PDF.",
            "Use daylight rather than a flash, which blows out the middle of a glossy page.",
            "Check for shadows from your own hand or phone before you take the shot; they are much harder to fix afterwards than to avoid.",
          ],
          "If the result is bigger than a portal will accept, compress the finished PDF rather than shrinking each photo — one pass over the whole document gives a better result.",
        ],
      },
    ],
    faqs: [
      {
        q: "Will my photos lose quality?",
        a: "A JPG or PNG is embedded at its original resolution rather than re-encoded, so it is as sharp in the PDF as it is on disk. Only unusual formats are converted first, so the browser has something it can embed.",
      },
      {
        q: "Can I put several photos on one page?",
        a: "Not in one pass — this is one image per page. For a contact sheet, arrange them in a document first and export that to PDF.",
      },
      {
        q: "How do I get one PDF per photo instead?",
        a: "Convert them together, then run the split tool on the result with a chunk size of one page.",
      },
    ],
    keywords: [
      "how to convert photos to pdf",
      "jpg to pdf",
      "combine images into one pdf",
      "phone photos to pdf for a form",
    ],
  },
  {
    slug: "how-to-add-page-numbers-to-a-pdf",
    tool: "add-page-numbers",
    title: "How to Add Page Numbers to a Finished PDF",
    h1: "How to add page numbers to a finished PDF",
    description:
      "Number a document after it has been assembled, write formats like Page 3 of 12, start from any number, and leave the cover page unnumbered.",
    date: "2026-08-22",
    minutes: 3,
    lead:
      "Numbering is a problem created by assembly. Each source document was numbered correctly on its own; joined together into a tender pack, the sequence restarts three times and no one can refer to anything.",
    sections: [
      {
        h: "Numbering the finished document, not the sources",
        body: [
          "The alternative is reopening every source file, renumbering, re-exporting and re-merging — and doing it again the next time a section is added. Stamping numbers onto the assembled PDF treats the pack as the document it now is.",
          "It also means the numbers match what a reader sees. Page 14 of the pack is page 14, regardless of which annexure it came from.",
        ],
      },
      {
        h: "Formats worth using",
        body: [
          "A bare number is right for most documents. Page n of total earns its place in anything that gets printed and handed around, because a missing sheet becomes obvious.",
          [
            "n — 1, 2, 3.",
            "Page n — a little more formal, and clearer in a document with other figures in the margin.",
            "Page n of total — for print, tenders and anything legal.",
          ],
        ],
      },
      {
        h: "Covers, annexures and starting numbers",
        body: [
          "Skipping the first page is the common requirement: a cover should not be page one. Turning that on begins the numbering on the second sheet.",
          "Starting from a number other than one matters when a document is a section of something larger — an annexure that continues from page 40 of the main pack should say 41, not 1.",
        ],
      },
      {
        h: "Where to put them",
        body: [
          "Bottom centre is the safe default and the hardest to collide with existing content. Bottom right suits documents that will be flipped through in a binder. If your layout already fills the margin, crop the pages first rather than stamping a number on top of a footer.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I write 'Page 3 of 12' instead of just a number?",
        a: "Yes — in the format box, n becomes the current page and total becomes the page count, so Page n of total produces exactly that.",
      },
      {
        q: "How do I leave the cover unnumbered?",
        a: "Turn on skip the first page. Numbering then starts on the second sheet, counting from whatever start number you set.",
      },
      {
        q: "Will the numbers print?",
        a: "Yes. They are written into the page as content, sitting in the margin about 28 points from the edge, so they behave like anything else on the page.",
      },
    ],
    keywords: [
      "how to add page numbers to a pdf",
      "number pdf pages",
      "page x of y in a pdf",
      "add page numbers after merging",
    ],
  },
  {
    slug: "how-to-remove-a-pdf-password",
    tool: "unlock-pdf",
    title: "How to Remove a Password From a PDF You Own",
    h1: "How to remove a password from a PDF you own",
    description:
      "The difference between a PDF that is restricted and one that is encrypted, how to remove each, and why a bank statement password is usually easier than it looks.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "Two completely different things are called a password-protected PDF, and knowing which one you have in front of you decides whether this takes a second or needs something you already know.",
    sections: [
      {
        h: "Restricted versus encrypted",
        body: [
          "A restricted PDF opens fine but refuses to print, copy or edit. Those limits are set by an owner password, and they are honoured by the reader as a matter of convention — the document itself is perfectly readable. Re-saving the file drops the restrictions without touching a single page.",
          "An encrypted PDF will not open at all without its user password. Here the content is genuinely scrambled, and no tool can read the pages until the correct password is supplied. There is nothing to be clever about: the password is the key.",
        ],
      },
      {
        h: "Statements that arrive locked",
        body: [
          "Banks, insurers and utilities routinely send statements encrypted with something derived from data they already hold about you — a customer number, a date of birth, the first letters of a name, sometimes a combination in a documented format.",
          "The covering email almost always states the format. Once you have opened the document once, removing the password gives you a copy you can search, print and file without typing it every time.",
        ],
      },
      {
        h: "What to expect from the result",
        body: [
          "A restricted file is re-saved as it is: the pages, the text layer and the size all come back essentially unchanged.",
          "A file that needed its open password has to be rebuilt from what was decrypted, so the copy may lose its text layer and change size. That is a real trade — keep the original alongside it.",
        ],
      },
      {
        h: "The line worth not crossing",
        body: [
          "Unlocking a document you are entitled to open is ordinary housekeeping. Trying to get into someone else's document is not, and no tool that works by brute force belongs in a browser tab anyway. If you do not have the password, the answer is to ask whoever sent it.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can a tool crack a password I do not know?",
        a: "Not for an encrypted PDF, and it should not try. Restrictions that only block printing or copying are a different matter — those are removed by re-saving the file, because the content was never encrypted.",
      },
      {
        q: "Is it safe to type my password into a web page?",
        a: "It depends entirely on whether the page sends it anywhere. Here the decryption happens in your own browser, so the password and the document both stay on your machine — you can verify that by using the tool offline.",
      },
      {
        q: "Why is my unlocked file larger than the original?",
        a: "Because a file that needed its open password is rebuilt from rendered pages, which loses the text layer and changes the size. Restricted files are simply re-saved and stay as they were.",
      },
    ],
    keywords: [
      "how to remove a pdf password",
      "unlock a bank statement pdf",
      "remove pdf printing restrictions",
      "pdf password remover free",
    ],
  },
];
