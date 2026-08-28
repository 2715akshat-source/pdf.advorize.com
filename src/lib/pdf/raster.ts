/**
 * Decoders for the two image formats no browser will open: Photoshop and
 * TIFF. Both hand back plain RGBA, which the converter paints onto a canvas
 * and embeds like any other picture.
 *
 * Neither is a complete implementation of its format, and neither should be:
 * what matters is the flattened image a person expects to see. For a PSD that
 * is the composite Photoshop already saved at the end of the file, so layers,
 * masks and adjustments never have to be understood at all. For a TIFF it is
 * the first image in the file, in the handful of encodings scanners and
 * cameras actually emit.
 */

export type Raster = { width: number; height: number; pixels: Uint8ClampedArray };

const fail = (what: string): never => {
  throw new Error(what);
};

/* ------------------------------------------------------------ Photoshop */

/**
 * A PSD ends with the composite image — the flattened picture Photoshop keeps
 * so other programs need not understand layers. Everything before it is
 * skipped by walking the four length-prefixed sections of the header.
 */
export function decodePsd(bytes: Uint8Array): Raster {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== 0x38425053) fail("This is not a Photoshop file.");

  const version = view.getUint16(4);
  if (version !== 1 && version !== 2)
    fail("This Photoshop file is in a version this tool does not read.");

  const channels = view.getUint16(12);
  const height = view.getUint32(14);
  const width = view.getUint32(18);
  const depth = view.getUint16(22);
  const mode = view.getUint16(24);

  if (depth !== 8)
    fail(
      `This file is ${depth} bits per channel. Save a copy as 8-bit — Image, Mode, 8 Bits/Channel — and it will convert.`,
    );
  if (mode !== 1 && mode !== 3 && mode !== 4)
    fail(
      "This file uses a colour mode this tool does not read. Convert it to RGB or greyscale and try again.",
    );
  if (!width || !height || width * height > 50e6)
    fail("This Photoshop file is too large to open in a browser tab.");

  /* Colour mode data, image resources, then layers: each is a length and a
     block, and the composite follows them. */
  let at = 26;
  for (let i = 0; i < 3; i++) at += 4 + view.getUint32(at);

  const compression = view.getUint16(at);
  at += 2;

  const perChannel = width * height;
  const planes: Uint8Array[] = [];

  if (compression === 0) {
    for (let c = 0; c < channels; c++)
      planes.push(bytes.subarray(at + c * perChannel, at + (c + 1) * perChannel));
  } else if (compression === 1) {
    /* PackBits, with every scanline's byte count listed up front. */
    const rows = height * channels;
    const lengths: number[] = [];
    for (let i = 0; i < rows; i++) lengths.push(view.getUint16(at + i * 2));
    at += rows * 2;

    for (let c = 0; c < channels; c++) {
      const plane = new Uint8Array(perChannel);
      let out = 0;
      for (let y = 0; y < height; y++) {
        const size = lengths[c * height + y];
        unpackBits(bytes.subarray(at, at + size), plane, out, width);
        out += width;
        at += size;
      }
      planes.push(plane);
    }
  } else {
    fail("This Photoshop file is zip-compressed, which this tool does not read.");
  }

  return { width, height, pixels: compose(planes, mode, width, height) };
}

/** Turns Photoshop's separate colour planes into one RGBA buffer. */
function compose(
  planes: Uint8Array[],
  mode: number,
  width: number,
  height: number,
): Uint8ClampedArray {
  const count = width * height;
  const out = new Uint8ClampedArray(count * 4);
  const plane = (i: number) => planes[i] ?? new Uint8Array(count);

  if (mode === 1) {
    const grey = plane(0);
    for (let i = 0; i < count; i++) {
      out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = grey[i];
      out[i * 4 + 3] = 255;
    }
    return out;
  }
  if (mode === 4) {
    /* Photoshop stores CMYK inverted, which is why the arithmetic looks
       backwards: 0 is full ink. */
    const [c, m, y, k] = [plane(0), plane(1), plane(2), plane(3)];
    for (let i = 0; i < count; i++) {
      out[i * 4] = (c[i] * k[i]) / 255;
      out[i * 4 + 1] = (m[i] * k[i]) / 255;
      out[i * 4 + 2] = (y[i] * k[i]) / 255;
      out[i * 4 + 3] = 255;
    }
    return out;
  }

  const [r, g, b] = [plane(0), plane(1), plane(2)];
  const alpha = planes[3];
  for (let i = 0; i < count; i++) {
    out[i * 4] = r[i];
    out[i * 4 + 1] = g[i];
    out[i * 4 + 2] = b[i];
    out[i * 4 + 3] = alpha ? alpha[i] : 255;
  }
  return out;
}

/** PackBits: a run length, then either one byte repeated or literal bytes. */
function unpackBits(
  source: Uint8Array,
  target: Uint8Array,
  at: number,
  limit: number,
) {
  let read = 0;
  let written = 0;
  while (read < source.length && written < limit) {
    const n = source[read++];
    if (n === 128) continue;
    if (n < 128) {
      for (let i = 0; i <= n && written < limit; i++)
        target[at + written++] = source[read++];
    } else {
      const value = source[read++];
      for (let i = 0; i < 257 - n && written < limit; i++)
        target[at + written++] = value;
    }
  }
}

/* ----------------------------------------------------------------- TIFF */

const TAG = {
  width: 256,
  height: 257,
  bits: 258,
  compression: 259,
  photometric: 262,
  stripOffsets: 273,
  samples: 277,
  rowsPerStrip: 278,
  stripCounts: 279,
  palette: 320,
  predictor: 317,
} as const;

/**
 * Baseline TIFF: uncompressed, PackBits, LZW and Deflate, in greyscale, RGB
 * or palette colour. That is what scanners, fax gateways and Photoshop's own
 * TIFF export produce; the exotic corners of the format (tiles, JPEG-in-TIFF,
 * 16-bit samples, CMYK separations) are named rather than mangled.
 */
export async function decodeTiff(bytes: Uint8Array): Promise<Raster> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const little = view.getUint16(0, true) === 0x4949;
  if (view.getUint16(2, little) !== 42)
    fail("This TIFF is in a variant this tool does not read.");

  const entries = new Map<number, number[]>();
  const ifd = view.getUint32(4, little);
  const count = view.getUint16(ifd, little);

  for (let i = 0; i < count; i++) {
    const at = ifd + 2 + i * 12;
    const tag = view.getUint16(at, little);
    const type = view.getUint16(at + 2, little);
    const length = view.getUint32(at + 4, little);
    const size = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 }[type as 1 | 2 | 3 | 4 | 5] ?? 1;
    const inline = length * size <= 4;
    const start = inline ? at + 8 : view.getUint32(at + 8, little);

    const values: number[] = [];
    for (let k = 0; k < Math.min(length, 4096); k++) {
      const p = start + k * size;
      if (p + size > bytes.length) break;
      values.push(
        size === 1
          ? view.getUint8(p)
          : size === 2
            ? view.getUint16(p, little)
            : view.getUint32(p, little),
      );
    }
    entries.set(tag, values);
  }

  const one = (tag: number, fallback: number) => entries.get(tag)?.[0] ?? fallback;
  const width = one(TAG.width, 0);
  const height = one(TAG.height, 0);
  const bits = one(TAG.bits, 1);
  const samples = one(TAG.samples, 1);
  const photometric = one(TAG.photometric, 1);
  const compression = one(TAG.compression, 1);
  const predictor = one(TAG.predictor, 1);

  if (!width || !height) fail("This TIFF has no image in it.");
  if (width * height > 50e6) fail("This TIFF is too large to open in a browser tab.");
  if (entries.has(322)) fail("This TIFF is stored in tiles, which this tool does not read.");
  if (bits !== 1 && bits !== 8)
    fail(`This TIFF is ${bits} bits per sample; only 1-bit and 8-bit images convert here.`);
  if (compression === 7 || compression === 6)
    fail("This TIFF holds JPEG data. Save it as a plain JPEG and it will convert.");
  if (compression === 2 || compression === 3 || compression === 4)
    fail("This is a fax-encoded TIFF, which this tool does not read.");

  const offsets = entries.get(TAG.stripOffsets) ?? [];
  const counts = entries.get(TAG.stripCounts) ?? [];
  if (!offsets.length) fail("This TIFF has no image data where one is expected.");

  const rowBytes = Math.ceil((width * samples * bits) / 8);
  const raw = new Uint8Array(rowBytes * height);
  let written = 0;

  for (let s = 0; s < offsets.length && written < raw.length; s++) {
    const strip = bytes.subarray(offsets[s], offsets[s] + (counts[s] ?? bytes.length));
    let data: Uint8Array;
    if (compression === 1) data = strip;
    else if (compression === 32773) {
      const rows = Math.min(
        one(TAG.rowsPerStrip, height),
        height - Math.floor(written / rowBytes),
      );
      data = new Uint8Array(rowBytes * Math.max(1, rows));
      unpackBits(strip, data, 0, data.length);
    } else if (compression === 5) data = lzw(strip, raw.length - written);
    else if (compression === 8 || compression === 32946) data = await inflate(strip);
    else return fail(`This TIFF uses compression ${compression}, which this tool does not read.`);

    raw.set(data.subarray(0, Math.min(data.length, raw.length - written)), written);
    written += data.length;
  }

  /* A horizontal predictor stores differences between neighbours, which have
     to be added back before the bytes mean anything. */
  if (predictor === 2 && bits === 8)
    for (let y = 0; y < height; y++) {
      const row = y * rowBytes;
      for (let x = samples; x < rowBytes; x++) raw[row + x] += raw[row + x - samples];
    }

  return {
    width,
    height,
    pixels: tiffPixels(raw, {
      width,
      height,
      rowBytes,
      bits,
      samples,
      photometric,
      palette: entries.get(TAG.palette),
    }),
  };
}

function tiffPixels(
  raw: Uint8Array,
  spec: {
    width: number;
    height: number;
    rowBytes: number;
    bits: number;
    samples: number;
    photometric: number;
    palette?: number[];
  },
): Uint8ClampedArray {
  const { width, height, rowBytes, bits, samples, photometric, palette } = spec;
  const out = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      out[i + 3] = 255;

      if (bits === 1) {
        const byte = raw[y * rowBytes + (x >> 3)] ?? 0;
        const bit = (byte >> (7 - (x & 7))) & 1;
        /* Photometric 0 means zero is white, which is how fax and most
           bilevel scans are stored. */
        const value = photometric === 0 ? (bit ? 0 : 255) : bit ? 255 : 0;
        out[i] = out[i + 1] = out[i + 2] = value;
        continue;
      }

      const at = y * rowBytes + x * samples;
      if (photometric === 3 && palette) {
        /* Palette entries are 16-bit, three planes of them in one array. */
        const index = raw[at] ?? 0;
        const size = palette.length / 3;
        out[i] = (palette[index] ?? 0) >> 8;
        out[i + 1] = (palette[size + index] ?? 0) >> 8;
        out[i + 2] = (palette[size * 2 + index] ?? 0) >> 8;
      } else if (samples >= 3) {
        out[i] = raw[at];
        out[i + 1] = raw[at + 1];
        out[i + 2] = raw[at + 2];
        if (samples >= 4) out[i + 3] = raw[at + 3];
      } else {
        const value = photometric === 0 ? 255 - raw[at] : raw[at];
        out[i] = out[i + 1] = out[i + 2] = value;
      }
    }
  }
  return out;
}

/** TIFF's LZW: variable-width codes, MSB first, with an early-change quirk. */
function lzw(source: Uint8Array, limit: number): Uint8Array {
  const out: number[] = [];
  let dictionary: (number[] | undefined)[] = [];
  const reset = () => {
    dictionary = [];
    for (let i = 0; i < 256; i++) dictionary[i] = [i];
    dictionary.length = 258;
  };
  reset();

  let width = 9;
  let previous: number[] | undefined;
  let bit = 0;

  const read = () => {
    let value = 0;
    for (let i = 0; i < width; i++) {
      const at = bit + i;
      const byte = source[at >> 3];
      if (byte === undefined) return -1;
      value = (value << 1) | ((byte >> (7 - (at & 7))) & 1);
    }
    bit += width;
    return value;
  };

  for (;;) {
    const code = read();
    if (code < 0 || code === 257 || out.length > limit) break;
    if (code === 256) {
      reset();
      width = 9;
      previous = undefined;
      continue;
    }
    let entry: number[];
    if (dictionary[code]) entry = dictionary[code]!;
    else if (previous) entry = [...previous, previous[0]];
    else break;

    out.push(...entry);
    if (previous) dictionary.push([...previous, entry[0]]);
    previous = entry;

    /* Early change: the code width grows one entry before it strictly must. */
    if (dictionary.length + 1 >= 1 << width && width < 12) width++;
  }
  return new Uint8Array(out);
}

/** Deflate, using the decompressor the browser already has. */
async function inflate(source: Uint8Array): Promise<Uint8Array> {
  const kind = source[0] === 0x78 ? "deflate" : "deflate-raw";
  const stream = new Blob([source as unknown as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream(kind));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* ---------------------------------------------------------------- shared */

/** Paints decoded pixels onto a canvas and hands back PNG bytes. */
export async function rasterToPng(raster: Raster): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = raster.width;
  canvas.height = raster.height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(raster.width, raster.height);
  image.data.set(raster.pixels);
  ctx.putImageData(image, 0, 0);
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
  canvas.width = canvas.height = 0;
  return new Uint8Array(await blob.arrayBuffer());
}
