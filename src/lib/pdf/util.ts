/** Small helpers shared by every engine. */

export type OutFile = { name: string; blob: Blob };

/** Strips the extension so output names read like `report-merged.pdf`. */
export function base(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

/**
 * Parses the page selections people actually type: `1-3, 5, 8-` and `last`.
 * Returns 0-based indices, de-duplicated, in the order given — the order
 * matters for the organise tool, which uses this to reorder pages.
 */
export function parsePages(input: string, total: number): number[] {
  const out: number[] = [];
  const push = (n: number) => {
    if (n >= 1 && n <= total && !out.includes(n - 1)) out.push(n - 1);
  };
  for (const rawPart of input.split(/[,\s]+/)) {
    const part = rawPart.trim().toLowerCase();
    if (!part) continue;
    if (part === "all") {
      for (let i = 1; i <= total; i++) push(i);
      continue;
    }
    const range = part.match(/^(\d+|first)?\s*-\s*(\d+|last)?$/);
    if (range) {
      const from = range[1] === "first" || !range[1] ? 1 : Number(range[1]);
      const to = range[2] === "last" || !range[2] ? total : Number(range[2]);
      const step = from <= to ? 1 : -1;
      for (let i = from; step > 0 ? i <= to : i >= to; i += step) push(i);
      continue;
    }
    if (part === "last") push(total);
    else if (part === "first") push(1);
    else if (/^\d+$/.test(part)) push(Number(part));
  }
  return out;
}

/** Zips a set of outputs when a tool produces more than one file. */
export async function zip(files: OutFile[], name: string): Promise<OutFile> {
  const JSZip = (await import("jszip")).default;
  const archive = new JSZip();
  for (const f of files) archive.file(f.name, f.blob);
  const blob = await archive.generateAsync({ type: "blob" });
  return { name, blob };
}

export function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}
