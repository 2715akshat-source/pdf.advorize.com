/**
 * Reverses a see-through watermark instead of painting over it.
 *
 * Most watermarks are one flat colour laid over the picture at a fixed
 * opacity: seen = (1 − α)·real + α·colour. The real picture is still in
 * there, just mixed — so once α and the colour are known, every covered
 * pixel can be solved for exactly: real = (seen − α·colour) / (1 − α). That
 * recovers a face under the letters, where any fill could only invent one.
 *
 * Neither is given, so both are found:
 *  - which pixels are watermark, and roughly how much, comes from comparing
 *    the picture with the inpainting fill's guess of what lies behind it;
 *  - the colour is whichever of white, black or the fitted colour makes
 *    that coverage most consistent;
 *  - α is where that coverage clusters, since every solid stroke pixel
 *    carries the same one — and the answer has to be smoother across the
 *    stroke edges than the watermarked picture was, or it is rejected.
 *
 * Pixels that are not watermark are left exactly as they were, which is
 * also what saves anything a loose brush stroke strayed across. When the
 * mark is opaque or multi-coloured, or α is too high to divide by safely,
 * this declines and the fill is used instead.
 */

export type Rgba = Uint8ClampedArray;
type Box = { x: number; y: number; w: number; h: number };
type Colour = [number, number, number];

const MIN_PIXELS = 40;
/** Above this, 1 − α is so small that JPEG noise is amplified into the result. */
const MAX_ALPHA = 0.85;

/** Coverage of each pixel along the line from the guess toward `colour`. */
function coverage(seen: Rgba, guess: Rgba, inside: number[], colour: Colour) {
  const a = new Float32Array(inside.length).fill(-1);
  inside.forEach((p, i) => {
    let num = 0, den = 0;
    for (let ch = 0; ch < 3; ch++) {
      const toward = colour[ch] - guess[p * 4 + ch];
      num += (seen[p * 4 + ch] - guess[p * 4 + ch]) * toward;
      den += toward * toward;
    }
    /* Where the background already is the watermark colour, the mark is
       invisible and there is nothing to solve. */
    if (den > 400) a[i] = num / den;
  });
  return a;
}

const quantile = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

/** A rough flat colour from a per-channel least-squares fit. */
function fittedColour(seen: Rgba, guess: Rgba, inside: number[]): Colour | null {
  const idx = inside.filter((p) => {
    let d = 0;
    for (let ch = 0; ch < 3; ch++) d += Math.abs(seen[p * 4 + ch] - guess[p * 4 + ch]);
    return d > 30;
  });
  if (idx.length < MIN_PIXELS) return null;
  const out: number[] = [];
  for (let ch = 0; ch < 3; ch++) {
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const p of idx) {
      const x = guess[p * 4 + ch];
      const y = seen[p * 4 + ch];
      sx += x; sy += y; sxx += x * x; sxy += x * y;
    }
    const n = idx.length;
    const den = n * sxx - sx * sx;
    if (Math.abs(den) < 1e-6) return null;
    const a = (n * sxy - sx * sy) / den;
    const alpha = 1 - a;
    if (alpha < 0.05) return null;
    out.push(Math.min(255, Math.max(0, (sy - a * sx) / n / alpha)));
  }
  return out as Colour;
}

/**
 * Solves the painted area of `seen` back to the picture under the
 * watermark. `guess` is the fill's result, `mask` the painted alpha; all
 * three are RGBA at the same size, and only pixels inside `box` are read.
 * Returns the repaired pixels, or null when the watermark is not a flat
 * see-through overlay.
 */
export function unblend(
  seen: Rgba,
  guess: Rgba,
  mask: Rgba,
  width: number,
  box: Box,
): Uint8ClampedArray<ArrayBuffer> | null {
  const inside: number[] = [];
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const p = y * width + x;
      if (mask[p * 4 + 3] > 128) inside.push(p);
    }
  }
  if (inside.length < MIN_PIXELS) return null;

  /* ------------------------------------------------ colour and coverage */

  const candidates: Colour[] = [[255, 255, 255], [0, 0, 0]];
  const fitted = fittedColour(seen, guess, inside);
  if (fitted) candidates.push(fitted);

  let best: { colour: Colour; a: Float32Array; level: number; spread: number } | null = null;
  for (const colour of candidates) {
    const a = coverage(seen, guess, inside, colour);
    const marked = [...a].filter((v) => v > 0.08);
    if (marked.length < MIN_PIXELS) continue;
    /* Solid stroke pixels all carry the same α, so the upper part of the
       distribution is a tight cluster for the right colour. */
    const level = quantile(marked, 0.75);
    const spread = (quantile(marked, 0.9) - quantile(marked, 0.6)) / level;
    if (!best || spread < best.spread) best = { colour, a, level, spread };
  }
  /* A loose cluster means no single colour explains the mark; a level near
     1 means it is opaque and there is nothing underneath to recover. */
  if (!best || best.level < 0.04 || best.level > MAX_ALPHA || best.spread > 0.3) return null;
  const { colour } = best;

  /* Each pixel's share of the full stroke: solid inside, fractional on the
     anti-aliased edge, nothing outside it. */
  const frac = new Float32Array(inside.length);
  let marked = 0;
  best.a.forEach((v, i) => {
    const f = v / best!.level;
    frac[i] = f < 0.3 ? 0 : f > 0.65 ? 1 : f;
    if (frac[i]) marked++;
  });
  if (marked < MIN_PIXELS) return null;

  /* ------------------------------------------------------ α and checking */

  const pos = new Int32Array(box.w * box.h).fill(-1);
  inside.forEach((p, i) => {
    pos[(((p / width) | 0) - box.y) * box.w + ((p % width) - box.x)] = i;
  });

  const solve = (alpha: number, i: number, ch: number) => {
    const p = inside[i];
    const a = alpha * frac[i];
    return (seen[p * 4 + ch] - a * colour[ch]) / (1 - a);
  };

  /* Where the fill guessed badly — hair under a loose brush stroke, say —
     real picture can pass for watermark. Un-mixing it then asks for a
     brightness below black or above white, which no real pixel has. Any
     connected patch where that is common is not watermark at all, and is
     left exactly as it was; so is any single pixel that asks for it. */
  const impossible = (i: number) => {
    for (let ch = 0; ch < 3; ch++) {
      const v = solve(best!.level, i, ch);
      if (v < -20 || v > 275) return true;
    }
    return false;
  };
  const seenPatch = new Uint8Array(inside.length);
  for (let start = 0; start < inside.length; start++) {
    if (!frac[start] || seenPatch[start]) continue;
    const patch = [start];
    seenPatch[start] = 1;
    for (let k = 0; k < patch.length; k++) {
      const p = inside[patch[k]];
      const x = (p % width) - box.x;
      const y = ((p / width) | 0) - box.y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= box.w || ny >= box.h) continue;
        const j = pos[ny * box.w + nx];
        if (j >= 0 && frac[j] && !seenPatch[j]) {
          seenPatch[j] = 1;
          patch.push(j);
        }
      }
    }
    const bad = patch.filter(impossible);
    const drop = bad.length > patch.length * 0.15 ? patch : bad;
    for (const i of drop) frac[i] = 0;
  }
  marked = frac.reduce((n, f) => n + (f ? 1 : 0), 0);
  if (marked < MIN_PIXELS) return null;

  /* Total variation across stroke edges: neighbouring pixels where at
     least one is watermark. The right α makes this smallest. */
  const pairs: [number, number][] = [];
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < box.w; x++) {
      const i = pos[y * box.w + x];
      if (i < 0) continue;
      const right = x + 1 < box.w ? pos[y * box.w + x + 1] : -1;
      const down = y + 1 < box.h ? pos[(y + 1) * box.w + x] : -1;
      if (right >= 0 && frac[i] !== frac[right]) pairs.push([i, right]);
      if (down >= 0 && frac[i] !== frac[down]) pairs.push([i, down]);
    }
  }
  if (pairs.length < MIN_PIXELS) return null;
  const step = Math.max(1, Math.floor(pairs.length / 60000));
  const roughness = (alpha: number) => {
    let tv = 0;
    for (let k = 0; k < pairs.length; k += step) {
      const [i, j] = pairs[k];
      for (let ch = 0; ch < 3; ch++) tv += Math.abs(solve(alpha, i, ch) - solve(alpha, j, ch));
    }
    return tv;
  };

  /* The coverage cluster is the estimate of α — measured on solid stroke
     pixels it lands within a point or two. Smoothness is only the check:
     it cannot choose α itself, because a picture with edges of its own
     always looks smoothest at a slightly-too-low α. */
  const untouched = roughness(0);
  const alpha = best.level;
  const lowest = roughness(alpha);
  /* The edges have to actually go away, not just get slightly softer. */
  if (lowest > untouched * 0.92) return null;

  /* --------------------------------------------------------- the answer */

  const out = new Uint8ClampedArray(seen);
  let wild = 0;
  inside.forEach((p, i) => {
    if (!frac[i]) return;
    for (let ch = 0; ch < 3; ch++) {
      const v = solve(alpha, i, ch);
      if (v < -25 || v > 280) wild++;
      out[p * 4 + ch] = v;
    }
  });
  /* Solving an opaque logo as if it were see-through gives values far out
     of range — that is the sign this was the wrong tool. */
  if (wild > marked * 3 * 0.08) return null;

  /* The rim of each stroke is where the coverage estimate is least sure
     and where JPEG ringing, amplified by the division, collects — a faint
     outline either way. A band one pixel each side of every stroke edge is
     rebuilt from its neighbours instead. Measured against the original,
     wider bands blur a face more than they help. */
  const W = box.w;
  const solid = new Uint8Array(W * box.h);
  inside.forEach((p, i) => {
    if (frac[i] === 1) solid[(((p / width) | 0) - box.y) * W + ((p % width) - box.x)] = 1;
  });
  const ring: number[] = [];
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < W; x++) {
      if (pos[y * W + x] < 0) continue;
      /* On the boundary when a neighbour is on the other side of it — so
         the ring straddles the edge, one pixel inside and one out. */
      const self = solid[y * W + x];
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dx = -1; dx <= 1 && !near; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          near = nx >= 0 && ny >= 0 && nx < W && ny < box.h && solid[ny * W + nx] !== self;
        }
      }
      if (near) ring.push(y * W + x);
    }
  }
  const at = (k: number) => (((k / W) | 0) + box.y) * width + (k % W) + box.x;
  for (let pass = 0; pass < 3; pass++) {
    for (const k of ring) {
      const x = k % W;
      const y = (k / W) | 0;
      const sum = [0, 0, 0];
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= W || ny >= box.h) continue;
          const q = (ny + box.y) * width + nx + box.x;
          for (let ch = 0; ch < 3; ch++) sum[ch] += out[q * 4 + ch];
          n++;
        }
      }
      const q = at(k);
      for (let ch = 0; ch < 3; ch++) out[q * 4 + ch] = sum[ch] / n;
    }
  }
  return out;
}
