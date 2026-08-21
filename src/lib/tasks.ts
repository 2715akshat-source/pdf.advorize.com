import { bySlug } from "./tools";
import type { Variant } from "./variants";

/**
 * Task pages.
 *
 * The intent pages in variants.ts are generated: one argument per kind,
 * applied to every tool. These are not. Each one here answers a specific
 * question people type — a size they have been given, a job they have been
 * asked to do — and the answer is different enough each time that generating
 * it would produce something worse than not publishing it.
 *
 * They render through the same page as the intent pages, because the shape is
 * the same: a headline, an argument, and the working tool itself.
 */

const compress = bySlug("compress-pdf")!;
const editor = bySlug("edit-pdf")!;

/** What a size target actually takes, given how a scan is built. */
function sizeTarget({
  slug,
  target,
  title,
  description,
  reality,
  advice,
}: {
  slug: string;
  target: string;
  title: string;
  description: string;
  reality: string;
  advice: (string | string[])[];
}): Variant {
  return {
    slug,
    kind: "free",
    tool: compress,
    title,
    description,
    h1: `Compress a PDF to ${target}`,
    lead: `Somebody has given you a number — an upload field that stops at ${target}, or a form that rejects anything larger. Whether you can hit it depends almost entirely on what kind of PDF you are holding, and it is worth thirty seconds to work out which.`,
    sections: [
      {
        h: `What ${target} realistically means`,
        body: [reality],
      },
      {
        h: "How to get there",
        body: advice,
      },
      {
        h: "If it still will not fit",
        body: [
          "There are three moves left, in order of how much they cost you:",
          [
            "Greyscale. A colour scan of black text carries three channels describing grey paper — dropping them is often a third of the size, at no cost to legibility.",
            "Crop. A scanner's black border and wide margins are bytes spent describing nothing. Trim them, then compress.",
            "Split. If the limit is per file rather than per submission, send the document in two parts. This is almost always allowed and almost never tried.",
          ],
          "What does not help is compressing twice. The second pass re-renders an already-rendered page: you lose quality and save almost nothing.",
        ],
      },
      {
        h: "Why the file was so large to begin with",
        body: [
          "A PDF from a word processor is a few kilobytes a page, because it stores text as instructions. A scan stores a photograph — an A4 sheet at 300 DPI is roughly 8.7 million pixels — and a scanner that saves those without much compression produces several megabytes per page.",
          "That is the whole story behind almost every oversized PDF. It is not corruption and nothing has gone wrong; it is eleven photographs in a wrapper.",
        ],
      },
    ],
    faqs: [
      {
        q: `Can every PDF be compressed to ${target}?`,
        a: "No, and any tool promising it is guessing. Scans compress dramatically; a document that is already only text has almost nothing to give up, because it was never large for the reason you think.",
      },
      {
        q: "Will the text still be searchable?",
        a: "No — compression re-renders each page as an image, which is exactly what produces the saving. Keep your original if you need to search or copy from it.",
      },
      {
        q: "Is my document uploaded to check the size?",
        a: "No. The compression and the resulting size are both worked out in your browser, so you can try three settings on a confidential file without any of them leaving your machine.",
      },
    ],
    keywords: [
      `compress pdf to ${target.toLowerCase()}`,
      `reduce pdf size to ${target.toLowerCase()}`,
      `pdf under ${target.toLowerCase()}`,
      "compress pdf for upload limit",
    ],
  };
}

export const tasks: Variant[] = [
  sizeTarget({
    slug: "compress-pdf-to-200kb",
    target: "200 KB",
    title: "Compress PDF to 200KB Free — For Form Uploads",
    description:
      "Compress a PDF to 200KB free — the limit most Indian government portals set for UPSC, SSC, RRB and IBPS uploads. What is achievable, and the order to try it in.",
    reality:
      "200 KB is the single most common limit on Indian government portals — UPSC, SSC, RRB, IBPS and most state PSC sites all sit at or near it, and NIC upload guidelines are why so many of them share the number. It is a demanding target but a realistic one for the documents these forms actually ask for: a certificate, a mark sheet, an ID page. A twenty-page bundle will not reach it, and is almost never what was asked for.",
    advice: [
      "Work down through the settings rather than starting at the bottom:",
      [
        "Check what the portal asked for first. These forms want one document, and people routinely upload a whole scanned folder — extracting the two pages requested usually solves the size problem outright.",
        "Medium quality, then look at the size. A two or three page scan often lands under 200 KB here.",
        "Add greyscale. On a scan of black text on white paper this is normally the biggest single saving available, and no portal has ever rejected a document for being greyscale.",
        "Low quality last. At two or three pages it stays perfectly legible, which is all the reviewing officer needs.",
      ],
      "Check the other rules while you are in there. Portals that cap size at 200 KB usually also fix the format and sometimes the page size, and a rejected upload is far more often the wrong format than the wrong size.",
    ],
  }),
  sizeTarget({
    slug: "compress-pdf-to-250kb",
    target: "250 KB",
    title: "Compress PDF to 250KB Free — No Signup",
    description:
      "Compress a PDF to 250KB free for NVSP, e-District, ESIC and other portals that cap uploads at a quarter of a megabyte. Runs in your browser with nothing uploaded.",
    reality:
      "250 KB turns up on voter ID, e-District and ESIC portals, and on plenty of bank and insurance forms. It is noticeably easier than 200 KB, and most address proofs, domicile certificates and affidavits reach it on medium quality without any visible change.",
    advice: [
      [
        "Medium quality first — for a one to three page certificate this usually clears 250 KB on its own.",
        "Greyscale if it is close. A colour scan of a black-and-white document is carrying three channels it does not need.",
        "Crop the scanner border before dropping quality. It costs nothing on the page and can be a surprising share of the file.",
      ],
      "If you are uploading a photograph of a document rather than a scan, retaking it in daylight and filling the frame with the page will do more for the file size than any setting here.",
    ],
  }),
  sizeTarget({
    slug: "compress-pdf-to-50kb",
    target: "50 KB",
    title: "Compress PDF to 50KB — What Is Actually Possible",
    description:
      "50KB is reachable for a single-page document and impossible for most scans. What the limit really means, how to get there, and when the answer is fewer pages.",
    reality:
      "50 KB is the hardest of the common targets, and it is worth being blunt: for a multi-page colour scan it is not achievable at any quality anyone would accept. For a single page — one certificate, one ID, one signature — it is reachable, and that is almost always what a 50 KB field is asking for.",
    advice: [
      [
        "Reduce to the one page that was requested. This is the step that decides whether 50 KB is possible at all.",
        "Greyscale and low quality together. At one page the result is still perfectly readable.",
        "Crop hard. Margins and scanner borders are pure cost at this size.",
      ],
      "If a single page at low quality and greyscale still will not fit, the source is the problem: a photograph taken at full phone resolution carries far more detail than the limit allows. Rescanning at 150 DPI rather than 600 will get you there where compression cannot.",
    ],
  }),
  sizeTarget({
    slug: "compress-pdf-for-government-form",
    target: "a government portal limit",
    title: "Compress PDF for a Government Form Upload",
    description:
      "Get a PDF under the 100KB, 200KB or 500KB cap on UPSC, SSC, RRB, IBPS and state portal forms — plus the rules that reject an upload even when the size is right.",
    reality:
      "Indian government portals almost all follow the same pattern: a hard cap of 100 KB, 200 KB, 250 KB or 500 KB per document, set because lakhs of candidates upload at once and NIC guidelines standardised the numbers. The cap is per file, not per application, which is the detail that solves most people's problem.",
    advice: [
      "The order that works, and it starts before compression:",
      [
        "Upload only the document that was asked for. A single certificate, not the folder it lives in. This alone fixes the majority of oversized uploads.",
        "Medium quality, then check. Most single certificates clear 200 KB here.",
        "Greyscale next — the largest saving available on a black-and-white document, and never a reason for rejection.",
        "Low quality last, and only for a page or two, where it stays entirely legible.",
      ],
      "Then check the rules that are not about size, because they cause at least as many rejections: the accepted format (many portals want PDF for documents and JPG for the photograph and signature), the page size, and whether the file is encrypted — a password-protected bank statement will be refused even at 20 KB.",
    ],
  }),
  sizeTarget({
    slug: "compress-pdf-to-100kb",
    target: "100 KB",
    title: "Compress PDF to 100KB — What Is Actually Possible",
    description:
      "100 KB is achievable for a short text document and unrealistic for most scans. What to try, in what order, and how to tell which kind of file you have.",
    reality:
      "100 KB is a hard target. A one or two page text document will already be near it, and a short scan can reach it on the low quality setting — but a ten page colour scan will not, and no tool can make it, because there is a floor below which a page stops being readable.",
    advice: [
      "Work down rather than straight to the bottom:",
      [
        "Try medium first and look at the size. A great many files clear the limit here and stay perfectly legible.",
        "Drop to low. This is the setting for exactly this situation — a hard cap where readability is all that matters.",
        "Turn on greyscale as well. On a scan of black text this is usually the single largest saving available.",
        "Delete the pages you do not need. Two pages at 100 KB is a different problem from ten.",
      ],
      "If the requirement is a photo of an ID or a single certificate, one page at low quality and greyscale will normally land well under the limit.",
    ],
  }),
  sizeTarget({
    slug: "compress-pdf-to-500kb",
    target: "500 KB",
    title: "Compress PDF to 500KB for a Form Upload",
    description:
      "500 KB is the most common government and bank upload limit, and it is reachable for most documents. The order to try settings in, and what to do about a long scan.",
    reality:
      "500 KB is the limit most application forms and banking portals set, and it is comfortably reachable for anything up to about ten scanned pages. Text documents are usually already below it.",
    advice: [
      [
        "Medium quality first — it clears 500 KB for most short scans without a visible change.",
        "Greyscale next, before dropping to low. Losing colour on a document scan costs nothing and often saves more than a quality step.",
        "Low quality only if both together fall short.",
      ],
      "For a long document, check whether the portal wants the whole thing. Application forms frequently ask for one certificate and are handed a twenty-page bundle — extracting the two pages that were requested solves the size problem completely.",
    ],
  }),
  sizeTarget({
    slug: "compress-pdf-under-1mb",
    target: "1 MB",
    title: "Compress PDF Under 1MB Without Wrecking It",
    description:
      "1 MB is a forgiving target that most scans reach on medium quality. How to hit it while keeping the document readable, and when to stop compressing and crop instead.",
    reality:
      "1 MB is the friendliest of the common limits. Most scans reach it on medium quality with no visible change at all, which means you rarely have to trade legibility for it.",
    advice: [
      [
        "Medium quality. Check the result before touching anything else — this alone clears 1 MB for the majority of documents.",
        "If it is close but not under, greyscale usually finishes the job.",
        "Crop before dropping quality. A scanner border can be a surprising share of a file, and trimming it costs you nothing on the page.",
      ],
      "Because the target is generous, this is the case where it is worth keeping the document sharp — resist going to low quality for the sake of a margin you do not need.",
    ],
  }),
  sizeTarget({
    slug: "compress-pdf-for-email",
    target: "an email attachment limit",
    title: "Compress a PDF to Fit an Email Attachment Limit",
    description:
      "Gmail and Outlook cap attachments around 20–25 MB, and encoding makes the real limit lower than the number suggests. How to get under it, and when to send a link instead.",
    reality:
      "Most mail providers cap attachments somewhere around 20–25 MB, and the effective limit is lower than the headline: attachments are encoded for transport, which inflates them by roughly a third on the way out. A 24 MB file can bounce off a 25 MB limit for that reason alone.",
    advice: [
      [
        "Aim for about two thirds of the stated limit, so the encoding overhead does not push you over it.",
        "Medium quality clears this for almost any document — email limits are generous compared with portal limits.",
        "Merge first, compress second, if you are sending several documents. One pass over the assembled file beats compressing each piece.",
      ],
      "If the recipient is inside a corporate mail system, their limit may be lower than yours and you will not be told. When a document is genuinely large — a scanned book, a set of drawings — a shared link is the professional answer rather than compressing until it is unreadable.",
    ],
  }),

  /* Signing is its own job, its own search, and its own set of worries. */
  {
    slug: "sign-pdf",
    kind: "free",
    tool: editor,
    title: "Sign a PDF Online Free — Nothing Uploaded",
    description:
      "Draw your signature straight onto a PDF and download it, without an account and without the document leaving your browser. What counts as a valid signature, and what does not.",
    h1: "Sign a PDF without uploading it",
    lead:
      "Signing is the single most common reason anyone opens a PDF editor, and it is also the moment people are least comfortable handing a document to a website. A contract with your signature on it is exactly the file that should not be uploaded anywhere.",
    sections: [
      {
        h: "Three ways to put a signature on a page",
        body: [
          [
            "Draw it. Trackpad, mouse or finger — on a phone this is close to signing on paper, and it is what most people mean by signing a PDF.",
            "Place an image. If you already have a signature saved as a PNG, drop it in and drag it into position. Best done with a transparent background.",
            "Type your name. Legally sufficient in many everyday contexts, and the fastest of the three when the form only asks for a name and a date.",
          ],
        ],
      },
      {
        h: "Electronic signatures and digital signatures",
        body: [
          "These are not the same thing, and the difference matters for exactly one category of document.",
          "An electronic signature is a mark you apply to show intent — a drawn signature, a typed name, a tick in a box. In most jurisdictions, including under India's Information Technology Act, the EU's eIDAS and the US ESIGN Act, that is legally valid for ordinary agreements, and it is what the overwhelming majority of contracts are signed with.",
          "A digital signature is a cryptographic operation using a certificate issued by a certificate authority. It proves who signed and detects any later change to the document. If you have been asked specifically for a digitally signed PDF — some tenders and statutory filings require one — you need a certificate, and no drawing tool can substitute for it.",
        ],
      },
      {
        h: "Signing without handing over the contract",
        body: [
          "The pages are rendered and your signature written into the file inside this tab. Nothing is uploaded, there is no account, and no copy of your agreement is sitting on a server waiting for a retention policy to delete it.",
          "You can check that: load the page, turn off your Wi-Fi, and sign anyway.",
        ],
      },
      {
        h: "Flatten it before you send it",
        body: [
          "If the document has form fields, flatten it after signing. A filled form is still interactive, which means the next person to open it can change the values or clear them by accident — flattening bakes everything into the page so what you sent is what they see.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a drawn signature legally binding?",
        a: "For ordinary agreements in most jurisdictions, yes — a drawn mark is a valid electronic signature and is what the majority of contracts get signed with. Documents that specifically require a certified digital signature are the exception, and they need a certificate rather than a drawing.",
      },
      {
        q: "Is my contract uploaded when I sign it?",
        a: "No. The document is rendered and rewritten in your browser, which is the point — a signed agreement is precisely the file that should not be sent to a stranger's server.",
      },
      {
        q: "How do I sign on a phone?",
        a: "Open the tool, choose Draw and sign with your finger. It is the closest thing to signing on paper, and usually produces a better signature than a trackpad does.",
      },
      {
        q: "Can I add a date and my name too?",
        a: "Yes — use the text tool to type anywhere on the page, which covers the date, a printed name, a place, or a reference number.",
      },
    ],
    keywords: [
      "sign pdf online free",
      "sign a pdf without uploading",
      "draw signature on pdf",
      "electronic signature pdf free",
      "sign pdf on phone",
    ],
  },
];

export const taskBySlug = (slug: string) => tasks.find((t) => t.slug === slug);
