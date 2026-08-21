import type { Post } from "./types";

/**
 * The upload-limit cluster.
 *
 * These are written for the searches that actually bring people to a PDF tool
 * in India: a portal has refused a document and the error message did not say
 * why. Sizes and rules come from what the portals themselves publish, and
 * where a number varies by portal the post says so rather than inventing a
 * figure — the whole value of these pages is being right about the detail.
 */
export const postsE: Post[] = [
  {
    slug: "compress-pdf-for-government-portals-india",
    tool: "compress-pdf",
    title: "PDF Size Limits on Indian Government Portals",
    h1: "PDF size limits on Indian government portals",
    description:
      "Why UPSC, SSC, RRB and IBPS forms cap uploads at 100KB or 200KB, how to get under the limit without making a document unreadable, and the rules that reject a file even when the size is right.",
    date: "2026-08-22",
    minutes: 7,
    lead:
      "Every application season, the same thing happens to hundreds of thousands of people: the certificate is correct, the form is filled, and the upload is refused for being 340 KB when the field allows 200. The limit is real, it is not negotiable, and getting under it is easier than it looks once you know why it exists.",
    sections: [
      {
        h: "Why the caps are so low",
        body: [
          "These portals are built for surges. When a recruitment notification opens, lakhs of candidates upload documents inside the same few days, and every megabyte is multiplied by that number for storage, backup and bandwidth. Capping each document at a couple of hundred kilobytes is what keeps the site standing.",
          "The numbers cluster because most portals follow the same central guidance, which is why 100 KB, 200 KB, 250 KB and 500 KB turn up again and again across UPSC, SSC, RRB, IBPS, state PSCs, scholarship portals and certificate verification sites.",
        ],
      },
      {
        h: "The step almost everybody skips",
        body: [
          "Before compressing anything, look at what was actually requested. These forms ask for one document — a mark sheet, a caste certificate, an ID page — and a very large share of oversized uploads are somebody's entire scanned folder attached to a field that wanted a single page.",
          "Extracting the requested page usually solves the problem outright, and it solves it without touching quality. It is also what the reviewing officer wants: one page they can read, not twenty they have to search.",
        ],
      },
      {
        h: "The order to try settings in",
        body: [
          [
            "Medium quality first. A single certificate frequently lands under 200 KB here with no visible change at all.",
            "Greyscale next. A colour scan of a black-and-white document carries three colour channels describing grey paper — dropping them is usually the single biggest saving available, and no portal has ever rejected a document for being greyscale.",
            "Crop the scanner border. The black edge of a scanner lid is bytes spent describing nothing.",
            "Low quality last, and only for a page or two, where it stays entirely legible.",
          ],
          "What does not help is compressing the same file twice. The second pass re-renders an already-rendered page: you lose clarity and save almost nothing.",
        ],
      },
      {
        h: "The rules that reject a file even at the right size",
        body: [
          "Size is only one of four checks, and the other three cause at least as many rejections:",
          [
            "Format. Many portals want the document as a PDF but the photograph and signature as JPG. Uploading the right thing in the wrong container fails silently.",
            "Encryption. A bank statement that arrived password-protected will be refused at any size, because the portal cannot open it. Remove the password first.",
            "Dimensions. Some forms specify page size or pixel dimensions for the photograph, separately from the file size.",
            "Legibility. A document compressed until the text is mush can be rejected on verification, which costs far more time than a second upload.",
          ],
        ],
      },
      {
        h: "Photograph and signature are a different problem",
        body: [
          "The document limits above are not the same as the photograph and signature limits, which are usually much smaller and specified in the notification — commonly tens of kilobytes, with fixed dimensions and a white background.",
          "Those are image requirements rather than PDF ones. Read the exact figures off the notification for the exam you are applying to, because they vary between boards and between years, and a photograph that passed last year may not pass this one.",
        ],
      },
      {
        h: "Doing it without handing over your documents",
        body: [
          "The files involved here are identity documents: Aadhaar, PAN, mark sheets, caste and domicile certificates, bank statements. They are exactly the documents that should not be uploaded to a site you found through a search result.",
          "Compressing in the browser removes the question. The file is read from your disk by the page you already have open and never leaves your machine — you can prove it by disconnecting from the internet and compressing anyway.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the usual PDF size limit on Indian government portals?",
        a: "Most sit at 100 KB, 200 KB, 250 KB or 500 KB per document, and the number is printed in the notification or beside the upload field. The cap is per file rather than per application, which is why splitting a bundle into the individual documents requested often solves it.",
      },
      {
        q: "Can any PDF be compressed to 200KB?",
        a: "A single certificate or ID page, almost always. A twenty-page colour scan, no — and that is nearly always a sign that more was attached than the form asked for.",
      },
      {
        q: "Will compressing make my certificate unreadable?",
        a: "Not at medium quality, and rarely at low quality for one or two pages. Check the result before uploading: a document rejected at verification for being illegible costs far more than a second attempt.",
      },
      {
        q: "Why was my upload rejected even though the size was fine?",
        a: "Usually format or encryption. Many portals want documents as PDF and the photo and signature as JPG, and any password-protected file is refused because the portal cannot open it.",
      },
    ],
    keywords: [
      "pdf size limit government portal",
      "compress pdf to 200kb for upsc",
      "ssc document upload size",
      "compress pdf for government form india",
      "document upload rejected size",
    ],
  },
  {
    slug: "why-your-pdf-upload-keeps-failing",
    tool: "compress-pdf",
    title: "Why Your PDF Upload Keeps Failing",
    h1: "Why your PDF upload keeps failing",
    description:
      "The five reasons a portal refuses a document — size, format, encryption, page dimensions and a corrupt scan — and how to tell which one you are hitting from the error you were given.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "Upload errors are written by developers for developers, so what you get is \"invalid file\" when the real problem is that your bank sent the statement with a password on it. There are only five common causes, and each has a tell.",
    sections: [
      {
        h: "1. It is too large",
        body: [
          "The most common, and the only one the error message usually names. Compress it, and before that, check whether you attached more pages than the field asked for.",
          "The tell: the error mentions a number, or the upload bar reaches the end and then fails.",
        ],
      },
      {
        h: "2. It is the wrong format",
        body: [
          "Forms routinely want the document as PDF and the photograph and signature as JPG, and some accept only one of the two anywhere. A file renamed from .jpg to .pdf is still a JPG and will be refused.",
          "The tell: the failure is instant, before anything appears to upload.",
        ],
      },
      {
        h: "3. It is encrypted",
        body: [
          "Statements from banks, insurers and utilities arrive password-protected. Even when it opens perfectly for you, the portal cannot read it, and the rejection rarely explains that.",
          "The tell: your reader asks for a password when you open it, or the properties panel says security is applied. Remove the password and re-upload.",
        ],
      },
      {
        h: "4. The dimensions are wrong",
        body: [
          "Separately from file size, some forms specify page size for documents or pixel dimensions for photographs. A phone photo is enormous in pixels even after it is small in kilobytes.",
          "The tell: the error mentions width, height, resolution or aspect ratio.",
        ],
      },
      {
        h: "5. The file is damaged",
        body: [
          "An interrupted download or a scanner that crashed mid-job produces a PDF that opens in some readers and not others. Portals are strict, and will refuse it.",
          "The tell: it opens in one application but not another, or the page count looks wrong. Re-download it from the source, or open and re-save it through a tool that rewrites the file.",
        ],
      },
      {
        h: "Working through it in order",
        body: [
          [
            "Open the file yourself. If it asks for a password, that is your answer.",
            "Check the extension matches what it really is, and what the form asked for.",
            "Reduce to the pages requested, then compress if it is still over.",
            "Re-read the field's own instructions — the size, format and dimension rules are usually printed right next to it, and they are the specification you are being tested against.",
          ],
        ],
      },
    ],
    faqs: [
      {
        q: "Why does the portal say invalid file when it opens fine for me?",
        a: "Nearly always encryption or format. A password-protected PDF opens for you because your reader has the password; the portal has no way in. A file with the wrong extension opens locally because your operating system ignores the name and reads the contents.",
      },
      {
        q: "Does renaming a JPG to .pdf work?",
        a: "No. The extension is a label, not the format. Convert it properly — the conversion takes a second and produces a real PDF.",
      },
      {
        q: "How do I know if my PDF is encrypted?",
        a: "If it asks for a password when you open it, it is. If it opens but will not let you print or copy, it carries restrictions, which some portals also reject. Both are removable if you own the document.",
      },
    ],
    keywords: [
      "pdf upload failing",
      "invalid file error document upload",
      "portal rejecting my pdf",
      "upload error file format not supported",
    ],
  },
  {
    slug: "scan-documents-with-your-phone",
    tool: "jpg-to-pdf",
    title: "How to Scan Documents Properly With a Phone",
    h1: "How to scan documents properly with a phone",
    description:
      "Get a clean, small, acceptable scan from a phone camera: how to light it, how to frame it, why flash ruins glossy pages, and how to turn the photos into one PDF.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "Most documents uploaded anywhere today were photographed rather than scanned, and most of the problems that follow — the file is too big, the text is unreadable, the portal rejected it — were created in the two seconds the photo was taken.",
    sections: [
      {
        h: "Light beats everything else",
        body: [
          "Daylight near a window, with the page flat and your body not casting a shadow across it, produces a better result than any app setting. Overhead room lighting puts your own shadow on the page; a flash blows out the middle of anything glossy and reflects off lamination.",
          "If you have to use artificial light, get two sources from different angles, or move the page rather than the light.",
        ],
      },
      {
        h: "Frame it square, fill the frame",
        body: [
          [
            "Shoot straight down, not at an angle. A skewed photograph stays skewed in the PDF, and cropping cannot un-skew it.",
            "Fill the frame with the page. Every pixel spent on your desk is a pixel not spent on the text, and it makes the file larger for no benefit.",
            "Rest the phone on something if you can. Camera shake is the difference between text that reads and text that has to be guessed at.",
          ],
        ],
      },
      {
        h: "Resolution: more is not better",
        body: [
          "A modern phone photographs an A4 page at far higher resolution than any portal needs, which is why the file is eight megabytes. For a document, 150 to 300 DPI equivalent is plenty — the text is completely legible and the file is a fraction of the size.",
          "If your phone has a document mode, it is usually doing exactly this: correcting the angle, cropping to the page, flattening the lighting and saving at a sensible resolution. It is worth using.",
        ],
      },
      {
        h: "Turning the photos into one document",
        body: [
          "Fifteen photographs are fifteen attachments, and no form wants that. Convert them to a single PDF, one image per page, in the order the document reads.",
          "Choose A4 if it will be printed or submitted to a portal expecting a standard page; choose fit-to-image if it is staying on screen and you would rather not have white bars. Then compress the finished PDF once, rather than shrinking each photograph first.",
        ],
      },
      {
        h: "What a phone cannot do",
        body: [
          "It cannot produce a text layer. A photograph of a page is a picture, so the result is not searchable and text cannot be copied out of it — extracting text from it needs OCR, which is a separate operation.",
          "For anything where the text itself matters — a document you will quote from, or a form someone will run a search against — a real scanner or an OCR step is worth the extra few minutes.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a phone photo good enough for an official upload?",
        a: "Usually yes, if it is square, evenly lit and legible at full size. What gets rejected is skew, shadow and glare, not the fact that a phone took it.",
      },
      {
        q: "Why is my phone scan so large?",
        a: "Because a phone camera captures far more detail than a document needs. Compressing the finished PDF fixes it, and shooting in document mode avoids it in the first place.",
      },
      {
        q: "Should I take one photo per page?",
        a: "Yes — one page per photograph, then combine them into a single PDF in reading order. Two pages in one frame halves the resolution of each.",
      },
    ],
    keywords: [
      "scan documents with phone",
      "phone scan for government form",
      "photo to pdf for upload",
      "how to scan without a scanner",
    ],
  },
  {
    slug: "are-online-pdf-tools-safe",
    tool: "merge-pdf",
    title: "Are Online PDF Tools Safe to Use?",
    h1: "Are online PDF tools safe?",
    description:
      "What happens to a document when you upload it to a PDF site, what retention policies actually promise, and how to tell an upload-based tool from one that never sends your file anywhere.",
    date: "2026-08-22",
    minutes: 6,
    lead:
      "The documents people put through PDF tools are the most sensitive files they own: signed contracts, bank statements, Aadhaar and PAN scans, medical records, a passport page for a visa application. It is worth knowing where they go.",
    sections: [
      {
        h: "What upload-based tools actually do",
        body: [
          "A server-side tool has to receive your file to work on it. It is transferred over the network, written to disk or held in memory on a machine you do not control, processed, and made available for download — usually through a link that works for anyone who has it.",
          "That is not a criticism of any particular service; it is what the architecture requires. It is also what enables the things a browser genuinely cannot do, like OCR on a long scan.",
        ],
      },
      {
        h: "What a retention policy promises, and what it does not",
        body: [
          "Most sites say files are deleted after an hour. Read carefully, because that sentence covers less than it appears to:",
          [
            "It is a promise about intention, not a technical guarantee you can verify.",
            "It usually does not cover backups, which have their own schedule.",
            "It rarely covers logs, which may record filenames and sizes long after the file is gone.",
            "It does not survive a change of ownership, a subpoena or a breach.",
          ],
          "None of that means a service is untrustworthy. It means the safety of your document depends on someone else's operational discipline, which is a different thing from your document never having left your machine.",
        ],
      },
      {
        h: "How to tell which kind you are using",
        body: [
          [
            "Watch for an upload progress bar. A tool that shows one is sending your file.",
            "Turn off your Wi-Fi after the page has loaded and try it. A browser-based tool keeps working; an upload-based one cannot.",
            "Open your browser's network panel and look for a large request when you press the button. The file either goes somewhere or it does not.",
          ],
          "That second test is the useful one, because it needs no technical knowledge and cannot be faked by marketing copy.",
        ],
      },
      {
        h: "When uploading is a reasonable decision",
        body: [
          "For a menu, a leaflet or a public brochure, the question barely matters — pick whatever tool does the job well. For OCR or a genuinely huge document, a server is the only practical option, and the sensible approach is to use a reputable one deliberately rather than the first result.",
          "The line worth drawing is around documents that identify you or bind you: identity documents, financial statements, anything signed, and anything belonging to a client. For those, uploading is a decision you are making on someone else's behalf as well as your own.",
        ],
      },
      {
        h: "The organisational version of this question",
        body: [
          "If you handle client documents, your obligations do not pause because a tool was convenient. Sending a client's contract through an unknown processor may breach an NDA or a data protection commitment regardless of how careful that processor turns out to be.",
          "A browser-based tool sidesteps the whole question: there is no processor, because there is no transfer.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are free online PDF tools safe?",
        a: "It depends entirely on whether they upload your file. A tool that processes in your browser cannot leak a document it never received; an upload-based tool is as safe as the company's operational discipline, which you cannot inspect.",
      },
      {
        q: "How can I check whether a tool uploads my file?",
        a: "Load the page, disconnect from the internet, and use it. If it works offline, nothing is being sent. It is the one test that does not require trusting anybody's marketing.",
      },
      {
        q: "Is it safe to put a bank statement through a PDF tool?",
        a: "Through a browser-based one, yes — the file never leaves your machine. Through an upload-based one, you are trusting a retention policy with a document that contains your account details and transaction history.",
      },
    ],
    keywords: [
      "are online pdf tools safe",
      "is it safe to upload documents to pdf sites",
      "pdf tool privacy",
      "secure pdf tools no upload",
    ],
  },
  {
    slug: "prepare-documents-for-a-job-application",
    tool: "merge-pdf",
    title: "How to Prepare Documents for a Job Application",
    h1: "How to prepare documents for a job application",
    description:
      "Assemble a clean document set for an application or a tender: what to merge, what to keep separate, how to name files, and the compression order that keeps everything legible.",
    date: "2026-08-22",
    minutes: 5,
    lead:
      "The difference between an application that is processed and one that sits in a queue is often nothing to do with the applicant. It is that somebody had to open eleven files named IMG_2841 to find the mark sheet.",
    sections: [
      {
        h: "Merge, or keep separate?",
        body: [
          "Follow the form. If the portal has one field per document, upload one document per field — merging everything into a bundle and attaching it eleven times is a common and costly mistake.",
          "If you are emailing an application or attaching a single supporting pack, merge into one file in the order a person would read it: covering letter, CV, then certificates in the order they were listed.",
        ],
      },
      {
        h: "Names are part of the document",
        body: [
          "Whoever opens your files will see the names before the contents, and a name that identifies itself saves them a step every time.",
          [
            "Use a scheme like surname-document-year: sharma-cv-2026.pdf, sharma-degree-certificate.pdf.",
            "Number them if the order matters: 01-covering-letter, 02-cv, 03-certificates.",
            "Avoid spaces and special characters — some portals silently reject them, and nobody tells you that is why.",
          ],
        ],
      },
      {
        h: "The order that keeps quality",
        body: [
          "There is a right sequence, and doing it backwards costs you clarity:",
          [
            "Extract the pages actually requested, before anything else.",
            "Rotate anything sideways and delete blank backs from duplex scans.",
            "Merge, if a single file is wanted.",
            "Compress once, at the end, against the limit you have to meet.",
            "Number the pages if it is a long pack, so it can be referred to in conversation.",
          ],
          "Compressing each piece and then merging gives you a larger, worse-looking document than merging and compressing once.",
        ],
      },
      {
        h: "Check it as the recipient will see it",
        body: [
          "Open the finished file and read it at 100%, top to bottom. It takes two minutes and catches the things that get applications returned: a page upside down, a certificate that compressed into illegibility, the wrong year's mark sheet, a page missing from the middle.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I send one PDF or several?",
        a: "Match the form. One field per document means one file per field. A single email attachment is better as one merged, ordered pack.",
      },
      {
        q: "In what order should I compress and merge?",
        a: "Merge first, compress last. One pass over the assembled document produces a smaller and better-looking file than compressing the parts separately.",
      },
      {
        q: "Does file naming really matter?",
        a: "To the person opening it, yes. It also matters technically — some portals reject names with spaces or special characters without explaining why.",
      },
    ],
    keywords: [
      "prepare documents for job application",
      "merge certificates into one pdf",
      "document set for application upload",
      "how to name files for an application",
    ],
  },
];
