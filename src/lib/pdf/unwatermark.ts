/**
 * Watermark removal for PDFs whose watermark is still its own object.
 *
 * A PDF watermark is usually not part of the page's picture at all. Acrobat,
 * Word and most converters write it as a separate piece of content — tagged
 * `/Artifact <</Subtype /Watermark>>`, put on an optional-content layer called
 * "Watermark", or added as a Watermark annotation. Deleting that piece gives
 * back the page exactly as it was: text still text, images untouched, nothing
 * re-rendered. That is always better than painting over it, so it runs first.
 *
 * When the watermark carries no tag, the visitor can name its text and every
 * text block spelling it out is dropped instead. Anything this cannot find is
 * part of the page image, and is handled by the brush-and-fill path.
 */
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFStream,
  decodePDFRawStream,
  type PDFContext,
  type PDFObject,
} from "pdf-lib";
import { base, pdfBlob, type OutFile } from "./util";

export type Stripped = OutFile & {
  /** How many separate watermark objects were deleted. */
  removed: number;
};

/* ------------------------------------------------------------- tokenising */

type Op = { op: string; args: string[]; start: number; end: number };

const WS = new Set([0, 9, 10, 12, 13, 32]);
const DELIM = new Set("()<>[]{}/%".split("").map((c) => c.charCodeAt(0)));

/**
 * Splits a content stream into operators with their operands and byte spans.
 * The spans are what make removal safe: everything not deleted is copied out
 * byte for byte, so the rest of the page is never rewritten.
 */
function tokenise(s: string): Op[] {
  const ops: Op[] = [];
  let args: string[] = [];
  let argStart = -1;
  let i = 0;
  const n = s.length;
  const code = (k: number) => s.charCodeAt(k);

  const skipString = () => {
    let depth = 0;
    for (; i < n; i++) {
      const c = s[i];
      if (c === "\\") i++;
      else if (c === "(") depth++;
      else if (c === ")" && --depth === 0) {
        i++;
        return;
      }
    }
  };

  /** Skips one operand — string, hex string, dict, array, name or number. */
  const skipOperand = (): void => {
    const c = s[i];
    if (c === "(") return skipString();
    if (c === "<" && s[i + 1] === "<") {
      i += 2;
      while (i < n && !(s[i] === ">" && s[i + 1] === ">")) {
        if (WS.has(code(i))) i++;
        else skipOperand();
      }
      i += 2;
      return;
    }
    if (c === "<") {
      i = s.indexOf(">", i) + 1 || n;
      return;
    }
    if (c === "[") {
      i++;
      while (i < n && s[i] !== "]") {
        if (WS.has(code(i))) i++;
        else skipOperand();
      }
      i++;
      return;
    }
    if (c === "/") i++;
    while (i < n && !WS.has(code(i)) && !DELIM.has(code(i))) i++;
  };

  while (i < n) {
    const c = code(i);
    if (WS.has(c)) {
      i++;
      continue;
    }
    if (s[i] === "%") {
      while (i < n && s[i] !== "\n" && s[i] !== "\r") i++;
      continue;
    }
    const start = i;
    if (argStart < 0) argStart = start;

    const isKeyword =
      !DELIM.has(c) && !/[0-9+\-.]/.test(s[i]);
    if (!isKeyword) {
      skipOperand();
      if (i === start) i++;
      args.push(s.slice(start, i));
      continue;
    }

    while (i < n && !WS.has(code(i)) && !DELIM.has(code(i))) i++;
    const op = s.slice(start, i);
    if (op === "true" || op === "false" || op === "null") {
      args.push(op);
      continue;
    }

    /* Inline image data is binary — jump straight to its EI. */
    if (op === "ID") {
      const re = /[\s]EI(?=[\s]|$)/g;
      re.lastIndex = i + 1;
      const m = re.exec(s);
      i = m ? m.index + m[0].length : n;
    }
    ops.push({ op, args, start: argStart, end: i });
    args = [];
    argStart = -1;
  }
  return ops;
}

/* ---------------------------------------------------------- text decoding */

/** Unicode for each character code, read from a font's ToUnicode CMap. */
type CMap = { map: Map<number, string>; bytes: 1 | 2 };

const latin1 = (bytes: Uint8Array) => {
  let out = "";
  for (const b of bytes) out += String.fromCharCode(b);
  return out;
};

const hexToStr = (hex: string) => {
  const h = hex.replace(/[^0-9a-f]/gi, "");
  let out = "";
  for (let k = 0; k < h.length; k += 2) {
    out += String.fromCharCode(parseInt(h.slice(k, k + 2).padEnd(2, "0"), 16));
  }
  return out;
};

const utf16 = (hex: string) => {
  let out = "";
  for (let k = 0; k + 4 <= hex.length; k += 4) {
    out += String.fromCharCode(parseInt(hex.slice(k, k + 4), 16));
  }
  return out;
};

function parseCMap(text: string): CMap {
  const map = new Map<number, string>();
  let bytes: 1 | 2 = 1;
  const range = text.match(/begincodespacerange\s*<([0-9a-f]+)>/i);
  if (range && range[1].length >= 4) bytes = 2;

  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/gi)) {
    for (const m of block[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi)) {
      map.set(parseInt(m[1], 16), utf16(m[2]));
    }
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/gi)) {
    const body = block[1];
    const re = /<([0-9a-f]+)>\s*<([0-9a-f]+)>\s*(<([0-9a-f]+)>|\[([^\]]*)\])/gi;
    for (const m of body.matchAll(re)) {
      const lo = parseInt(m[1], 16);
      const hi = parseInt(m[2], 16);
      if (hi - lo > 0xffff) continue;
      if (m[4]) {
        const first = parseInt(m[4], 16);
        for (let c = lo; c <= hi; c++) map.set(c, String.fromCharCode(first + c - lo));
      } else {
        const list = [...m[5].matchAll(/<([0-9a-f]+)>/gi)].map((x) => utf16(x[1]));
        list.forEach((u, k) => map.set(lo + k, u));
      }
    }
  }
  return { map, bytes };
}

/** Turns a string operand — `(…)` or `<…>` — into the bytes it encodes. */
function operandBytes(arg: string): string {
  if (arg.startsWith("<")) return hexToStr(arg.slice(1, -1));
  if (!arg.startsWith("(")) return "";
  const body = arg.slice(1, -1);
  let out = "";
  for (let k = 0; k < body.length; k++) {
    const c = body[k];
    if (c !== "\\") {
      out += c;
      continue;
    }
    const nx = body[++k];
    const esc: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" };
    if (nx in esc) out += esc[nx];
    else if (/[0-7]/.test(nx)) {
      const oct = body.slice(k, k + 3).match(/^[0-7]{1,3}/)![0];
      out += String.fromCharCode(parseInt(oct, 8));
      k += oct.length - 1;
    } else if (nx === "\r" || nx === "\n") {
      if (nx === "\r" && body[k + 1] === "\n") k++;
    } else out += nx;
  }
  return out;
}

function decodeText(raw: string, cmap: CMap | undefined): string {
  if (!cmap) return raw;
  let out = "";
  for (let k = 0; k < raw.length; k += cmap.bytes) {
    const c =
      cmap.bytes === 2
        ? (raw.charCodeAt(k) << 8) | raw.charCodeAt(k + 1)
        : raw.charCodeAt(k);
    out += cmap.map.get(c) ?? (cmap.bytes === 1 ? raw[k] : "");
  }
  return out;
}

/** Lower-case letters and digits only, so "D R A F T" still matches "draft". */
const squash = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/* ------------------------------------------------------------- resources */

const WATERMARKISH = /watermark|wasserzeichen|filigrane|marca de agua/i;

function lookupDict(ctx: PDFContext, obj: PDFObject | undefined) {
  const v = obj instanceof PDFRef ? ctx.lookup(obj) : obj;
  return v instanceof PDFDict ? v : undefined;
}

function streamText(ctx: PDFContext, obj: PDFObject | undefined): string | null {
  const v = obj instanceof PDFRef ? ctx.lookup(obj) : obj;
  if (v instanceof PDFRawStream) {
    try {
      return latin1(decodePDFRawStream(v).decode());
    } catch {
      return null;
    }
  }
  if (v instanceof PDFStream) return latin1(v.getContents());
  return null;
}

/** Is this optional-content group (or membership dict) a watermark layer? */
function isWatermarkLayer(ctx: PDFContext, obj: PDFObject | undefined): boolean {
  const dict = lookupDict(ctx, obj);
  if (!dict) return false;
  const name = dict.get(PDFName.of("Name"));
  if (name && WATERMARKISH.test(name.toString())) return true;
  /* An OCMD points at the groups it depends on. */
  const groups = dict.get(PDFName.of("OCGs"));
  const list = groups instanceof PDFArray ? groups.asArray() : groups ? [groups] : [];
  return list.some((g) => g !== obj && isWatermarkLayer(ctx, g));
}

/** Fonts in a resource dict, keyed by resource name, with their CMaps. */
function fontsOf(ctx: PDFContext, resources: PDFDict | undefined) {
  const out = new Map<string, CMap | undefined>();
  const fonts = lookupDict(ctx, resources?.get(PDFName.of("Font")));
  if (!fonts) return out;
  for (const [key, ref] of fonts.entries()) {
    const font = lookupDict(ctx, ref);
    const text = streamText(ctx, font?.get(PDFName.of("ToUnicode")));
    const composite = font?.get(PDFName.of("Subtype"))?.toString() === "/Type0";
    let cmap = text ? parseCMap(text) : undefined;
    if (cmap && composite) cmap = { ...cmap, bytes: 2 };
    out.set(key.toString(), cmap);
  }
  return out;
}

/* ---------------------------------------------------------------- cleaning */

/**
 * Removes watermark content from one content stream. Returns the new stream
 * text, or null when nothing in it was a watermark.
 */
function clean(
  ctx: PDFContext,
  source: string,
  resources: PDFDict | undefined,
  target: string,
  counter: { n: number },
): string | null {
  const ops = tokenise(source);
  const props = lookupDict(ctx, resources?.get(PDFName.of("Properties")));
  const fonts = fontsOf(ctx, resources);
  const drop: [number, number][] = [];

  /* Marked-content sections: a stack of open BDC/BMC, each remembering
     whether it opened a watermark. */
  const stack: { start: number; watermark: boolean }[] = [];
  let inWatermark = 0;

  /* Text objects, for matching the watermark by what it says. */
  let bt: { start: number; text: string } | null = null;
  let font: CMap | undefined;

  for (const o of ops) {
    if (o.op === "BDC" || o.op === "BMC") {
      let watermark = false;
      if (o.op === "BDC") {
        const [tag, prop] = o.args;
        const inline = prop?.startsWith("<<") ? prop : null;
        const named = !inline && prop ? props?.get(PDFName.of(prop.slice(1))) : undefined;
        if (tag === "/Artifact") {
          watermark = inline
            ? /\/Subtype\s*\/Watermark\b/.test(inline)
            : lookupDict(ctx, named)?.get(PDFName.of("Subtype"))?.toString() === "/Watermark";
        } else if (tag === "/OC") {
          watermark = isWatermarkLayer(ctx, named);
        }
      }
      stack.push({ start: o.start, watermark });
      if (watermark) inWatermark++;
      continue;
    }
    if (o.op === "EMC") {
      const open = stack.pop();
      if (open?.watermark) {
        inWatermark--;
        if (!inWatermark) {
          drop.push([open.start, o.end]);
          counter.n++;
        }
      }
      continue;
    }
    if (inWatermark || !target) continue;

    if (o.op === "BT") {
      bt = { start: o.start, text: "" };
    } else if (o.op === "Tf") {
      font = fonts.get(o.args[0]);
    } else if (bt && (o.op === "Tj" || o.op === "'" || o.op === '"')) {
      bt.text += decodeText(operandBytes(o.args[o.args.length - 1] ?? ""), font);
    } else if (bt && o.op === "TJ") {
      const arr = o.args[0] ?? "";
      for (const m of arr.matchAll(/\((?:\\.|[^\\)])*\)|<[0-9a-fA-F\s]*>/g)) {
        bt.text += decodeText(operandBytes(m[0]), font);
      }
    } else if (bt && o.op === "ET") {
      /* Only a block that says the watermark and nothing else — a page
         whose whole body is one text object must not go with it. */
      const said = squash(bt.text);
      if (said.includes(target) && said.split(target).join("").length <= 3) {
        drop.push([bt.start, o.end]);
        counter.n++;
      }
      bt = null;
    }
  }

  if (!drop.length) return null;
  drop.sort((a, b) => a[0] - b[0]);
  let out = "";
  let at = 0;
  for (const [from, to] of drop) {
    if (from < at) continue;
    out += source.slice(at, from);
    at = to;
  }
  return out + source.slice(at);
}

const toBytes = (s: string) => {
  const b = new Uint8Array(s.length);
  for (let k = 0; k < s.length; k++) b[k] = s.charCodeAt(k) & 0xff;
  return b;
};

/** Cleans the Form XObjects a page draws, since watermarks often live in one. */
function cleanForms(
  ctx: PDFContext,
  resources: PDFDict | undefined,
  target: string,
  counter: { n: number },
  seen: Set<string>,
) {
  const xobjects = lookupDict(ctx, resources?.get(PDFName.of("XObject")));
  if (!xobjects) return;
  for (const [, ref] of xobjects.entries()) {
    if (!(ref instanceof PDFRef) || seen.has(ref.toString())) continue;
    seen.add(ref.toString());
    const stream = ctx.lookup(ref);
    if (!(stream instanceof PDFStream)) continue;
    if (stream.dict.get(PDFName.of("Subtype"))?.toString() !== "/Form") continue;

    const own = lookupDict(ctx, stream.dict.get(PDFName.of("Resources"))) ?? resources;
    const text = streamText(ctx, stream);
    if (text === null) continue;
    const next = clean(ctx, text, own, target, counter);
    if (next !== null) {
      const dict: Record<string, PDFObject> = {};
      for (const [k, v] of stream.dict.entries()) {
        const key = k.asString().slice(1);
        if (key !== "Filter" && key !== "DecodeParms" && key !== "Length") dict[key] = v;
      }
      ctx.assign(ref, ctx.flateStream(toBytes(next), dict));
    }
    cleanForms(ctx, own, target, counter, seen);
  }
}

/* ------------------------------------------------------------------- run */

export async function stripPdfWatermark(
  file: File,
  text: string,
  onProgress: (f: number) => void,
): Promise<Stripped> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), {
    ignoreEncryption: true,
  });
  const ctx = doc.context;
  const target = squash(text);
  const counter = { n: 0 };
  const seen = new Set<string>();
  const pages = doc.getPages();

  pages.forEach((page, i) => {
    const node = page.node;
    const resources = node.Resources();

    /* Watermark annotations, and annotations on a watermark layer. */
    const annots = node.Annots();
    if (annots) {
      const keep = annots.asArray().filter((ref) => {
        const a = lookupDict(ctx, ref);
        const wm =
          a?.get(PDFName.of("Subtype"))?.toString() === "/Watermark" ||
          isWatermarkLayer(ctx, a?.get(PDFName.of("OC")));
        if (wm) counter.n++;
        return !wm;
      });
      if (keep.length !== annots.size()) node.set(PDFName.of("Annots"), ctx.obj(keep));
    }

    /* The page's own content, joined into one stream — a marked section is
       allowed to start in one part and end in the next. */
    const contents = node.get(PDFName.of("Contents"));
    const parts =
      contents instanceof PDFArray
        ? contents.asArray()
        : contents
          ? [contents]
          : [];
    const texts = parts.map((p) => streamText(ctx, p));
    if (texts.every((t) => t !== null)) {
      const next = clean(ctx, texts.join("\n"), resources, target, counter);
      if (next !== null) {
        node.set(PDFName.of("Contents"), ctx.register(ctx.flateStream(toBytes(next))));
      }
    }

    cleanForms(ctx, resources, target, counter, seen);
    onProgress((i + 1) / pages.length);
  });

  return {
    name: `${base(file.name)}-no-watermark.pdf`,
    blob: pdfBlob(await doc.save()),
    removed: counter.n,
  };
}
