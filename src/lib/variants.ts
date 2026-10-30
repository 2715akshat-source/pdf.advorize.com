import { tools, type Tool } from "./tools";
import { tasks } from "./tasks";

/**
 * Intent pages.
 *
 * People do not search for "merge pdf" alone — they search for it free, they
 * search for it without a signup, and they search for an alternative to the
 * tool that made them log in. Those are different questions with the same
 * answer, and a page that only repeats the tool's own copy with a keyword
 * swapped is the sort of thing search engines are right to ignore.
 *
 * So each kind here carries its own written argument, and each page also
 * carries facts specific to the tool it is about — what it does to the text
 * layer, what it hands back, whether it takes more than one file — plus the
 * working tool itself. Four kinds, not ten: "online" is what the tool page
 * already targets, and "no watermark" is part of the free argument rather
 * than a page of its own.
 */

export type VariantKind = "free" | "no-login" | "offline" | "alternatives";

export type Variant = {
  slug: string;
  kind: VariantKind;
  tool: Tool;
  title: string;
  description: string;
  h1: string;
  lead: string;
  sections: { h: string; body: (string | string[])[] }[];
  faqs: { q: string; a: string }[];
  keywords: string[];
};

/* ------------------------------------------------------------------ facts */

/** Tools that copy page objects, against those that re-render the page. */
const RASTER = new Set(["compress", "flatten", "grayscale", "toJpg", "toPng"]);

type Traits = {
  keepsText: boolean;
  output: string;
  multiple: boolean;
};

export function traits(tool: Tool): Traits {
  const raster = RASTER.has(tool.engine);
  const output =
    tool.engine === "toText"
      ? "a .txt file"
      : tool.engine === "toJpg"
        ? "JPG images, zipped when there is more than one page"
        : tool.engine === "toPng"
          ? "PNG images, zipped when there is more than one page"
          : tool.engine === "split"
            ? "one PDF per piece, zipped when there is more than one"
            : tool.engine === "unwatermark"
              ? "the same kind of file you put in — a PDF stays a PDF, a PNG stays a PNG"
              : "a PDF";

  return {
    keepsText: !raster && tool.engine !== "toText" && tool.engine !== "unlock",
    output,
    multiple: Boolean(tool.multiple),
  };
}

/* ------------------------------------------------------------ the angles */

const textLine = (tool: Tool) =>
  tool.engine === "unwatermark"
    ? `A watermark that is its own layer is deleted, so the page keeps its text. One that is part of the picture is painted out and filled in, which turns just that page into an image — every page you did not touch is copied across as it was.`
    : traits(tool).keepsText
    ? `${tool.name} copies your pages rather than re-rendering them, so the text in the document you get back is still text — selectable, searchable, and the same file size it was.`
    : `${tool.name} re-renders each page, which is what makes it work — so the result is visually identical and no longer carries a text layer. Keep your original if you need to search it later.`;

function freeVariant(tool: Tool): Variant {
  return {
    slug: `${tool.slug}-free`,
    kind: "free",
    tool,
    title: `${tool.name} Free — No Limits, No Watermark`,
    description: `${tool.name}, free and without the usual catch: no daily cap, no watermark on the file you get back, and no paid tier holding the useful setting hostage. Runs in your browser.`,
    h1: `${tool.name}, free — and free of the usual catch`,
    lead: `Everything advertised as a free PDF tool is free until the second file, or free until you want the output without a badge stamped across it. This one is free in the boring sense: use it as often as you like, get back exactly what you put in.`,
    sections: [
      {
        h: "What free usually means, and what it means here",
        body: [
          "The standard free tier on a PDF site is a trial with the word free on it. Two conversions a day, a watermark on anything you export, the quality setting greyed out, or a size cap set just below the file you are actually holding.",
          "The reason is straightforward: running conversions on a server costs money per file, so the free tier has to be a funnel. When the work happens in your own browser instead, it costs the site nothing — which is why there is no cap here to negotiate with.",
          [
            "No account, no email, nothing to verify.",
            "No daily limit — run it ten times in a row.",
            "No watermark, no badge, no promotional page appended to the document.",
            "No paid setting: every option on the tool is the full one.",
          ],
        ],
      },
      {
        h: `What you actually get back from ${tool.name}`,
        body: [
          `The output is ${traits(tool).output}, named after the file you put in.`,
          textLine(tool),
          "The only real limit is your device's memory, because that is the only thing doing the work.",
        ],
      },
      {
        h: "So what is the catch",
        body: [
          "We are a marketing and web development studio, not a SaaS company. These tools are the clearest demonstration of how we build, and some of the people who use them later need a website or a campaign. That is the entire business model, and it does not require anything from you.",
        ],
      },
    ],
    faqs: [
      {
        q: `Is ${tool.name} really free with no limits?`,
        a: "Yes. There is no account, no daily cap and no paid tier, because there is no per-file cost to recover — the work happens on your machine rather than on a server.",
      },
      {
        q: "Will the file have a watermark?",
        a: "No. Nothing is added to your document that you did not add yourself, and there is no promotional page appended to it.",
      },
      tool.faqs[0],
    ],
    keywords: [
      `${tool.name.toLowerCase()} free`,
      `free ${tool.name.toLowerCase()}`,
      `${tool.name.toLowerCase()} no watermark`,
      `${tool.name.toLowerCase()} unlimited free`,
    ],
  };
}

function noLoginVariant(tool: Tool): Variant {
  return {
    slug: `${tool.slug}-without-login`,
    kind: "no-login",
    tool,
    title: `${tool.name} Without Login or Sign-Up`,
    description: `${tool.name} with no account, no email and no verification step — open the page and use it. Your file is processed in your browser, so there is nothing to sign up to.`,
    h1: `${tool.name}, with nothing to sign up to`,
    lead: `A sign-up wall in front of a two-second operation exists to collect an email address, not to make the tool work. There is no account here, and there is nowhere for one to be useful.`,
    sections: [
      {
        h: "Why so many PDF tools ask you to register",
        body: [
          "An account is how a service enforces a quota, and a quota is how it recovers the cost of processing your file on its servers. Registration is also the point: an email address is worth more than the conversion.",
          "None of that machinery applies to a tool that runs in the tab you already have open. There is no quota to enforce, no queue to hold your place in, and no per-file cost to recover — so there is nothing for an account to do.",
        ],
      },
      {
        h: "What no account actually changes",
        body: [
          [
            "No email, no password, no verification link, no marketing you have to unsubscribe from later.",
            "No session tying a document to a person — the two are never associated, because neither is sent anywhere.",
            "Nothing to lose access to: no history, no expiring links, no file sitting on a server waiting to be deleted.",
          ],
          `${tool.name} works the moment the page loads, on a shared machine, in a private window, on someone else's laptop.`,
        ],
      },
      {
        h: "The trade-off, honestly",
        body: [
          "Because there is no account, there is no history. Nothing you do here is saved, so a document you finished yesterday is not waiting for you today — the file on your disk is the record.",
          "For everything these tools do, that is the right trade. It is also the only arrangement in which the privacy claim means anything.",
        ],
      },
    ],
    faqs: [
      {
        q: `Do I need an account to use ${tool.name}?`,
        a: "No — there is no account system at all. Open the page and use the tool; nothing is gated behind an email address.",
      },
      {
        q: "Is my work saved anywhere?",
        a: "No, and deliberately so. Nothing is stored on a server or in your browser between visits, which is why there is nothing to sign in to.",
      },
      tool.faqs[tool.faqs.length - 1],
    ],
    keywords: [
      `${tool.name.toLowerCase()} without login`,
      `${tool.name.toLowerCase()} no sign up`,
      `${tool.name.toLowerCase()} without registration`,
      `${tool.name.toLowerCase()} no account`,
    ],
  };
}

function offlineVariant(tool: Tool): Variant {
  return {
    slug: `${tool.slug}-offline`,
    kind: "offline",
    tool,
    title: `${tool.name} Without Uploading — Works Offline`,
    description: `${tool.name} that never uploads your document: the work happens in your browser, so it keeps working with the internet switched off. The proof takes ten seconds.`,
    h1: `${tool.name} without uploading anything`,
    lead: `Most online PDF tools are not really online tools — they are upload forms. Your document goes to a server, gets processed there, and comes back, and the privacy policy is the only thing standing between it and whoever runs the machine.`,
    sections: [
      {
        h: "Upload-based against browser-based",
        body: [
          "A server-side tool has to receive your file to work on it. That is not a criticism of any particular service — it is what the architecture requires. It means your document exists, however briefly, on hardware you do not control, and the guarantee you are given is a promise to delete it later.",
          "A browser-based tool loads a library into the page and does the work with your own processor. The file is read from disk by the page you already have open, worked on in memory, and handed back as a download. There is no endpoint it could be sent to.",
        ],
      },
      {
        h: "The ten-second proof",
        body: [
          `Load this page, turn off your Wi-Fi, and use ${tool.name} anyway. It works, because everything it needs is already in the tab.`,
          "No privacy policy can demonstrate that. It is the one claim in this whole category you can verify yourself, without taking anybody's word for anything.",
        ],
      },
      {
        h: "Where this matters most",
        body: [
          [
            "Signed contracts and anything under an NDA.",
            "Bank and card statements — routinely the most sensitive document anyone owns.",
            "Passport scans, medical records and ID sent to a landlord or an employer.",
            "Anything belonging to a client, where uploading it is a decision you are making on their behalf.",
          ],
          "If your organisation has a policy about where documents may be processed, this is the version of the tool that satisfies it.",
        ],
      },
    ],
    faqs: [
      {
        q: `Does ${tool.name} upload my file?`,
        a: "No. The tool runs in JavaScript inside your browser tab — the document is read from disk, worked on in memory and handed back. There is no upload endpoint.",
      },
      {
        q: "How can I verify that?",
        a: "Load the page, disconnect from the internet, and use it. It keeps working, which is only possible if nothing is being sent anywhere.",
      },
      {
        q: "Is anything about my document recorded?",
        a: "Nothing that describes it. File names, contents and page counts never leave your browser; anonymous analytics record which tool pages are visited and nothing about the files opened in them.",
      },
    ],
    keywords: [
      `${tool.name.toLowerCase()} without uploading`,
      `${tool.name.toLowerCase()} offline`,
      `${tool.name.toLowerCase()} privacy`,
      `${tool.name.toLowerCase()} local browser`,
    ],
  };
}

function alternativesVariant(tool: Tool): Variant {
  const t = traits(tool);
  return {
    slug: `${tool.slug}-alternatives`,
    kind: "alternatives",
    tool,
    title: `${tool.name} Alternatives — How to Compare Them`,
    description: `Comparing ${tool.name.toLowerCase()} tools: what separates a browser-based one from an upload-based one, the six questions worth asking, and where each approach genuinely wins.`,
    h1: `Choosing a ${tool.name.toLowerCase()} tool`,
    lead: `Every tool in this category produces roughly the same document, so the output is not what separates them. What separates them is where your file goes, what it costs you to find out, and what the free tier is really for.`,
    sections: [
      {
        h: "The two architectures",
        body: [
          "Nearly every option is one of two things. An upload-based service takes your document to a server, does the work there, and sends it back — which is what allows it to offer OCR, heavy compression and anything else that needs real computing power, and what obliges it to receive your file.",
          "A browser-based tool does the work on your machine. It cannot offer the server-only features, and in exchange your document never leaves the room. Neither is universally better; they are different trades, and the right one depends on the document.",
        ],
      },
      {
        h: "Six questions worth asking of any of them",
        body: [
          [
            "Does my file get uploaded? If the answer is yes, the rest is a matter of trusting a retention policy.",
            "Is there an account wall, and what is it actually for — a quota, or an email address?",
            "Is the output watermarked, or a page appended to the document?",
            "Is there a daily limit or a file size cap, and where is it set?",
            "Does the result keep its text layer, or has the page been turned into an image?",
            "Does the tool tell you what it did to the file, or just hand it back?",
          ],
          "That fifth one catches more people than the rest combined. A tool that flattens a document to images while claiming to have compressed it has technically told the truth and left you with an unsearchable file.",
        ],
      },
      {
        h: `Where this ${tool.name.toLowerCase()} tool sits`,
        body: [
          `It is browser-based. Nothing is uploaded, there is no account, no cap and no watermark, and the output is ${t.output}.`,
          textLine(tool),
          t.multiple
            ? "It takes several files at once, and the order you arrange them in is the order it uses."
            : "It works on one document at a time, which is what this operation needs.",
        ],
      },
      {
        h: "When to use something else",
        body: [
          [
            "OCR — turning a scan into searchable text. That needs a trained model and real processing; a browser tool cannot honestly offer it.",
            "Very large documents, where a server's memory beats your laptop's.",
            "Editing existing text so paragraphs reflow, which needs the source document rather than any PDF tool.",
            "Certified digital signatures, which need a certificate authority, not a drawing tool.",
          ],
          "For everything else — the merging, splitting, converting and marking-up that makes up the overwhelming majority of PDF work — the browser is enough, and it is the option where the question of where your file went does not arise.",
        ],
      },
    ],
    faqs: [
      {
        q: `What is the best free ${tool.name.toLowerCase()} tool?`,
        a: "The honest answer is that they mostly produce the same document, so pick on the terms rather than the output: whether your file is uploaded, whether there is a cap, and whether the result is watermarked. Those differ far more than the quality does.",
      },
      {
        q: "Are browser-based tools slower?",
        a: "For structural work — merging, splitting, reordering — they are usually faster, because nothing is being uploaded or queued. For heavy rendering on a large document, a server has more memory to throw at it.",
      },
      {
        q: "Is a desktop application better?",
        a: "It has the same privacy property and more power, at the cost of installing and paying for something. For occasional work, a browser tool covers it; for daily production work, a desktop application earns its price.",
      },
    ],
    keywords: [
      `${tool.name.toLowerCase()} alternative`,
      `best free ${tool.name.toLowerCase()} tool`,
      `${tool.name.toLowerCase()} comparison`,
      `${tool.name.toLowerCase()} vs`,
    ],
  };
}

const BUILDERS = [
  freeVariant,
  noLoginVariant,
  offlineVariant,
  alternativesVariant,
];

const generated: Variant[] = tools.flatMap((tool) =>
  BUILDERS.map((build) => build(tool)),
);

/* Written task pages sit alongside the generated ones — same shape, same
   route, different origin. Imported here rather than the other way round so
   everything that enumerates pages has one list to read. */
export const variants: Variant[] = [...generated, ...tasks];

export const variantBySlug = (slug: string) =>
  variants.find((v) => v.slug === slug);

export const variantsForTool = (tool: string) =>
  variants.filter((v) => v.tool.slug === tool);
