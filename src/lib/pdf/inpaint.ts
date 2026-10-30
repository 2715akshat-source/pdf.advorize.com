/**
 * Fills in the parts of a picture the visitor has painted over.
 *
 * The fill is LaMa, a published inpainting model, run by ONNX Runtime inside
 * the tab on WebAssembly — threaded when the page is cross-origin isolated
 * (see next.config.ts). WebGPU is left off: this export's FFT blocks fail
 * on it at run time even though the session loads.
 * It works from the surroundings, so a sky stays sky and a brick wall keeps
 * its courses. The weights (~200 MB) are fetched once from Hugging Face and
 * kept in the Cache API; the picture itself never goes anywhere.
 *
 * Only the painted pixels are ever replaced. The model sees a 512 × 512 crop
 * around each painted patch, and its answer is blended back into the
 * full-resolution original under a softened copy of the mask — so every
 * pixel you did not paint is the pixel you gave it.
 *
 * Where the watermark is see-through, the fill is only the first step: its
 * guess is used to work out the watermark's colour and opacity, and the
 * picture underneath is then solved for exactly (see unblend.ts) — real
 * detail back, not invented detail.
 *
 * If the model cannot load (an old phone out of memory, no network the first
 * time) a plain diffusion fill takes over: good on flat and soft backgrounds,
 * weaker on detail, but it always produces something.
 */

import { unblend } from "./unblend";

const ORT_VERSION = "1.20.1";
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const MODEL_URL =
  "https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx";
const MODEL_CACHE = "advorize-models-v1";
const SIDE = 512;

/* The slice of the onnxruntime-web API this file uses. */
type Tensor = { data: Float32Array };
type Session = {
  inputNames: string[];
  outputNames: string[];
  run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
};
type Ort = {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  Tensor: new (type: "float32", data: Float32Array, dims: number[]) => Tensor;
  InferenceSession: {
    create(model: Uint8Array, opts: { executionProviders: string[] }): Promise<Session>;
  };
};

declare global {
  interface Window {
    ort?: Ort;
  }
}

export type ModelProgress = (fraction: number, label: string) => void;

/* ------------------------------------------------------------ the model */

let ortPromise: Promise<Ort> | null = null;

/** The runtime comes from a CDN as a plain script, which keeps its wasm and
    worker files out of the Next bundle entirely. */
function loadOrt(): Promise<Ort> {
  if (window.ort) return Promise.resolve(window.ort);
  ortPromise ??= new Promise<Ort>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${ORT_BASE}ort.min.js`;
    script.async = true;
    script.onload = () => {
      const ort = window.ort;
      if (!ort) return reject(new Error("The AI runtime did not start."));
      ort.env.wasm.wasmPaths = ORT_BASE;
      ort.env.wasm.numThreads = self.crossOriginIsolated
        ? Math.min(8, navigator.hardwareConcurrency || 4)
        : 1;
      resolve(ort);
    };
    script.onerror = () => {
      ortPromise = null;
      reject(new Error("The AI runtime could not be downloaded."));
    };
    document.head.appendChild(script);
  });
  return ortPromise;
}

/** Fetches the weights, from the cache when they have been fetched before. */
async function modelBytes(onProgress: ModelProgress): Promise<Uint8Array> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(MODEL_CACHE);
    const hit = await cache.match(MODEL_URL);
    if (hit) {
      onProgress(1, "Loading the AI model");
      return new Uint8Array(await hit.arrayBuffer());
    }
  } catch {
    /* Private windows can refuse the Cache API — just download every time. */
  }

  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) throw new Error("The AI model could not be downloaded.");
  const total = Number(res.headers.get("content-length")) || 208_044_816;
  const reader = res.body.getReader();
  const out = new Uint8Array(total);
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (got + value.length > out.length) throw new Error("Unexpected model size.");
    out.set(value, got);
    got += value.length;
    onProgress(got / total, "Downloading the AI model (first time only)");
  }
  const bytes = got === out.length ? out : out.slice(0, got);
  try {
    await cache?.put(
      MODEL_URL,
      new Response(bytes as unknown as BodyInit, {
        headers: { "content-type": "application/octet-stream" },
      }),
    );
  } catch {
    /* Out of quota — it still works, it just downloads again next time. */
  }
  return bytes;
}

let sessionPromise: Promise<{ ort: Ort; session: Session }> | null = null;

/** Starts the model loading. Safe to call early and more than once. */
export function prepareModel(onProgress: ModelProgress = () => {}) {
  sessionPromise ??= (async () => {
    const ort = await loadOrt();
    const bytes = await modelBytes(onProgress);
    onProgress(1, "Starting the AI model");
    const session = await ort.InferenceSession.create(bytes, {
      executionProviders: ["wasm"],
    });
    return { ort, session };
  })().catch((e) => {
    sessionPromise = null;
    throw e;
  });
  return sessionPromise;
}

/* --------------------------------------------------------------- helpers */

const canvasOf = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

const ctx2d = (c: HTMLCanvasElement) =>
  c.getContext("2d", { willReadFrequently: true })!;

type Box = { x: number; y: number; w: number; h: number };

/**
 * Groups the painted pixels into patches, each with enough of its
 * surroundings for the model to see what belongs there. Works on a coarse
 * grid so a 6000-pixel photo does not mean 36 million flood-fill steps.
 */
function patches(mask: Uint8ClampedArray, w: number, h: number): Box[] {
  const cell = Math.max(4, Math.ceil(Math.max(w, h) / 512));
  const gw = Math.ceil(w / cell);
  const gh = Math.ceil(h / cell);
  const grid = new Uint8Array(gw * gh);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[(y * w + x) * 4 + 3] > 8) grid[((y / cell) | 0) * gw + ((x / cell) | 0)] = 1;
    }
  }

  const label = new Int32Array(gw * gh).fill(-1);
  const boxes: Box[] = [];
  for (let start = 0; start < grid.length; start++) {
    if (!grid[start] || label[start] >= 0) continue;
    let x0 = gw, y0 = gh, x1 = 0, y1 = 0;
    const stack = [start];
    label[start] = boxes.length;
    while (stack.length) {
      const k = stack.pop()!;
      const gx = k % gw;
      const gy = (k / gw) | 0;
      x0 = Math.min(x0, gx); y0 = Math.min(y0, gy);
      x1 = Math.max(x1, gx); y1 = Math.max(y1, gy);
      /* 8-connected, plus a cell of slack, so the letters of one word stay
         one patch instead of six. */
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          const nk = ny * gw + nx;
          if (grid[nk] && label[nk] < 0) {
            label[nk] = boxes.length;
            stack.push(nk);
          }
        }
      }
    }
    boxes.push({
      x: x0 * cell,
      y: y0 * cell,
      w: (x1 - x0 + 1) * cell,
      h: (y1 - y0 + 1) * cell,
    });
  }

  /* Square crops with context around each patch: the model needs to see
     roughly as much surrounding picture as it is asked to invent. */
  return boxes.map((b) => {
    const side = Math.min(
      Math.max(w, h),
      Math.max(SIDE / 2, Math.round(Math.max(b.w, b.h) * 1.8 + 64)),
    );
    const cw = Math.min(side, w);
    const ch = Math.min(side, h);
    const x = Math.round(Math.min(Math.max(0, b.x + b.w / 2 - cw / 2), w - cw));
    const y = Math.round(Math.min(Math.max(0, b.y + b.h / 2 - ch / 2), h - ch));
    return { x, y, w: cw, h: ch };
  });
}

/** The mask, grown a few pixels and softened — anti-aliased watermark edges
    sit just outside where a brush stroke ends. */
function softMask(mask: HTMLCanvasElement, grow: number) {
  const out = canvasOf(mask.width, mask.height);
  const c = ctx2d(out);
  c.filter = `blur(${grow}px)`;
  for (let k = 0; k < 3; k++) c.drawImage(mask, 0, 0);
  c.filter = "none";
  return out;
}

/* ---------------------------------------------------------- model fill */

async function modelFill(
  image: HTMLCanvasElement,
  mask: HTMLCanvasElement,
  boxes: Box[],
  onProgress: ModelProgress,
) {
  const { ort, session } = await prepareModel(onProgress);
  let recovered = false;
  const result = canvasOf(image.width, image.height);
  ctx2d(result).drawImage(image, 0, 0);
  const soft = softMask(mask, Math.max(1.5, image.width / 1200));

  for (const [k, b] of boxes.entries()) {
    onProgress(k / boxes.length, "Removing the watermark");

    const tile = canvasOf(SIDE, SIDE);
    const tc = ctx2d(tile);
    tc.imageSmoothingQuality = "high";
    tc.drawImage(result, b.x, b.y, b.w, b.h, 0, 0, SIDE, SIDE);
    const px = tc.getImageData(0, 0, SIDE, SIDE).data;

    const mtile = canvasOf(SIDE, SIDE);
    const mc = ctx2d(mtile);
    mc.drawImage(soft, b.x, b.y, b.w, b.h, 0, 0, SIDE, SIDE);
    const mp = mc.getImageData(0, 0, SIDE, SIDE).data;

    const plane = SIDE * SIDE;
    const img = new Float32Array(plane * 3);
    const hole = new Float32Array(plane);
    for (let i = 0; i < plane; i++) {
      img[i] = px[i * 4] / 255;
      img[i + plane] = px[i * 4 + 1] / 255;
      img[i + plane * 2] = px[i * 4 + 2] / 255;
      hole[i] = mp[i * 4 + 3] > 10 ? 1 : 0;
    }

    const [imageName, maskName] = session.inputNames;
    const out = await session.run({
      [imageName]: new ort.Tensor("float32", img, [1, 3, SIDE, SIDE]),
      [maskName]: new ort.Tensor("float32", hole, [1, 1, SIDE, SIDE]),
    });
    const data = out[session.outputNames[0]].data;
    /* This export answers in 0–255; others answer in 0–1. */
    let peak = 0;
    for (let i = 0; i < data.length; i += 97) peak = Math.max(peak, data[i]);
    const gain = peak <= 1.5 ? 255 : 1;

    const filled = tc.createImageData(SIDE, SIDE);
    for (let i = 0; i < plane; i++) {
      filled.data[i * 4] = data[i] * gain;
      filled.data[i * 4 + 1] = data[i + plane] * gain;
      filled.data[i * 4 + 2] = data[i + plane * 2] * gain;
      filled.data[i * 4 + 3] = 255;
    }
    tc.putImageData(filled, 0, 0);

    /* Back to full size, kept only where the mask is, laid on the original. */
    const patch = canvasOf(b.w, b.h);
    const pc = ctx2d(patch);
    pc.imageSmoothingQuality = "high";
    pc.drawImage(tile, 0, 0, b.w, b.h);
    pc.globalCompositeOperation = "destination-in";
    pc.drawImage(soft, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    ctx2d(result).drawImage(patch, b.x, b.y);
  }
  onProgress(1, "Done");
  return { canvas: result, recovered: recover(image, result, mask, union(boxes)) };
}

/** The smallest box holding every patch. */
function union(boxes: Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    w: Math.max(...boxes.map((b) => b.x + b.w)) - x,
    h: Math.max(...boxes.map((b) => b.y + b.h)) - y,
  };
}

/**
 * When the watermark turns out to be see-through, swaps the fill in
 * `result` for the solved real pixels — using the fill only as the guess
 * the solve starts from. Done once over every patch together, from the
 * untouched `original`: one watermark has one colour and one opacity, and
 * the more of it the fit sees, the better it pins them down. Returns
 * whether it could solve them; if not, the fill stays.
 */
function recover(
  original: HTMLCanvasElement,
  result: HTMLCanvasElement,
  mask: HTMLCanvasElement,
  b: Box,
) {
  const rc = ctx2d(result);
  const seen = ctx2d(original).getImageData(b.x, b.y, b.w, b.h);
  const guess = rc.getImageData(b.x, b.y, b.w, b.h).data;
  const painted = ctx2d(mask).getImageData(b.x, b.y, b.w, b.h).data;
  const solved = unblend(seen.data, guess, painted, b.w, { x: 0, y: 0, w: b.w, h: b.h });
  if (!solved) return false;
  rc.putImageData(new ImageData(solved, b.w, b.h), b.x, b.y);
  return true;
}

/* ------------------------------------------------------- fallback fill */

/**
 * Pyramid diffusion: fill the holes at a coarse scale where they are small,
 * then carry that down level by level, smoothing only inside the hole.
 */
function diffusionFill(image: HTMLCanvasElement, mask: HTMLCanvasElement) {
  const w = image.width;
  const h = image.height;
  const src = ctx2d(image).getImageData(0, 0, w, h).data;
  const m = ctx2d(mask).getImageData(0, 0, w, h).data;

  type Level = { w: number; h: number; c: Float32Array; known: Uint8Array };
  const top: Level = { w, h, c: new Float32Array(w * h * 3), known: new Uint8Array(w * h) };
  for (let i = 0; i < w * h; i++) {
    top.known[i] = m[i * 4 + 3] > 8 ? 0 : 1;
    for (let ch = 0; ch < 3; ch++) top.c[i * 3 + ch] = src[i * 4 + ch];
  }

  const levels = [top];
  while (levels.at(-1)!.w > 8 && levels.at(-1)!.h > 8) {
    const a = levels.at(-1)!;
    const lw = Math.ceil(a.w / 2);
    const lh = Math.ceil(a.h / 2);
    const b: Level = { w: lw, h: lh, c: new Float32Array(lw * lh * 3), known: new Uint8Array(lw * lh) };
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        let n = 0;
        const sum = [0, 0, 0];
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const sx = Math.min(a.w - 1, x * 2 + dx);
            const sy = Math.min(a.h - 1, y * 2 + dy);
            const k = sy * a.w + sx;
            if (!a.known[k]) continue;
            n++;
            for (let ch = 0; ch < 3; ch++) sum[ch] += a.c[k * 3 + ch];
          }
        }
        const k = y * lw + x;
        if (n) {
          b.known[k] = 1;
          for (let ch = 0; ch < 3; ch++) b.c[k * 3 + ch] = sum[ch] / n;
        }
      }
    }
    levels.push(b);
    if (!b.known.includes(0)) break;
  }

  for (let li = levels.length - 1; li >= 0; li--) {
    const L = levels[li];
    const up = levels[li + 1];
    for (let y = 0; y < L.h; y++) {
      for (let x = 0; x < L.w; x++) {
        const k = y * L.w + x;
        if (L.known[k]) continue;
        if (up) {
          const uk = Math.min(up.h - 1, y >> 1) * up.w + Math.min(up.w - 1, x >> 1);
          for (let ch = 0; ch < 3; ch++) L.c[k * 3 + ch] = up.c[uk * 3 + ch];
        }
      }
    }
    for (let pass = 0; pass < 12; pass++) {
      for (let y = 0; y < L.h; y++) {
        for (let x = 0; x < L.w; x++) {
          const k = y * L.w + x;
          if (L.known[k]) continue;
          let n = 0;
          const sum = [0, 0, 0];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) continue;
            const nk = ny * L.w + nx;
            n++;
            for (let ch = 0; ch < 3; ch++) sum[ch] += L.c[nk * 3 + ch];
          }
          for (let ch = 0; ch < 3; ch++) L.c[k * 3 + ch] = sum[ch] / n;
        }
      }
    }
    if (li > 0) for (let k = 0; k < L.known.length; k++) L.known[k] = 1;
  }

  const out = canvasOf(w, h);
  const oc = ctx2d(out);
  const data = oc.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    for (let ch = 0; ch < 3; ch++) data.data[i * 4 + ch] = top.c[i * 3 + ch];
    data.data[i * 4 + 3] = src[i * 4 + 3];
  }
  oc.putImageData(data, 0, 0);
  return out;
}

/* ------------------------------------------------------------------ api */

export type FillResult = {
  canvas: HTMLCanvasElement;
  usedModel: boolean;
  /** The watermark was see-through and the real pixels were solved for. */
  recovered: boolean;
};

/**
 * Replaces the painted area of `image`. `mask` is a canvas the same size
 * whose alpha marks what to remove.
 */
export async function removePainted(
  image: HTMLCanvasElement,
  mask: HTMLCanvasElement,
  onProgress: ModelProgress,
): Promise<FillResult> {
  const md = ctx2d(mask).getImageData(0, 0, mask.width, mask.height).data;
  const boxes = patches(md, mask.width, mask.height);
  if (!boxes.length) return { canvas: image, usedModel: false, recovered: false };

  let filled: Awaited<ReturnType<typeof modelFill>>;
  try {
    filled = await modelFill(image, mask, boxes, onProgress);
  } catch {
    onProgress(0.5, "Using the quick fill");
    /* The quick fill is rough, but still good enough as the guess that
       un-mixing a see-through watermark starts from. */
    const result = diffusionFill(image, softMask(mask, 1));
    const recovered = recover(image, result, mask, union(boxes));
    return { canvas: result, usedModel: false, recovered };
  }
  return { ...filled, usedModel: true };
}
