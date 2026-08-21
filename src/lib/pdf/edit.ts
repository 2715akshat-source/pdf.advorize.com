/**
 * The editor's export step: takes what was drawn on screen and writes it into
 * the original PDF with pdf-lib, so the pages themselves are untouched —
 * existing text stays selectable and images keep their resolution. Only the
 * additions are new content.
 *
 * Coordinates arrive in **unrotated page points with a top-left origin**,
 * which is what the editor works in (it renders every page at `rotation: 0`,
 * so what you see is the page's own coordinate system). The only conversion
 * needed here is the y-flip into PDF user space.
 */
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { base, pdfBlob } from "./util";

export type Item =
  | {
      id: string;
      page: number;
      type: "text";
      x: number;
      y: number;
      text: string;
      size: number;
      color: string;
    }
  | {
      id: string;
      page: number;
      type: "draw";
      points: [number, number][];
      color: string;
      width: number;
      opacity: number;
    }
  | {
      id: string;
      page: number;
      type: "image";
      x: number;
      y: number;
      w: number;
      h: number;
      /** the original bytes, so the image is embedded rather than re-encoded */
      bytes: Uint8Array;
      png: boolean;
      /** blob URL used to show the image while editing; not part of the export */
      preview: string;
    };

/** #rrggbb → the 0–1 triple pdf-lib wants. */
function color(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function applyEdits(file: File, items: Item[]) {
  const doc = await PDFDocument.load(await file.arrayBuffer(), {
    ignoreEncryption: true,
  });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const item of items) {
    const page = pages[item.page];
    if (!page) continue;

    /* The editor draws on the unrotated page, so a page carrying a /Rotate
       needs its annotations turned by the same amount to land where they were
       placed — and the media box origin is not always at zero. */
    const { x: ox, y: oy, height } = page.getMediaBox();
    const spin = page.getRotation().angle % 360;
    const up = (px: number, py: number) =>
      ({ x: ox + px, y: oy + height - py }) as const;

    if (item.type === "text") {
      const lines = item.text.split("\n");
      lines.forEach((line, i) => {
        if (!line) return;
        /* y is the top of the text box, so the first baseline sits one
           ascender down and each line after it a full line-height further. */
        const at = up(item.x, item.y + item.size * (0.82 + i * 1.25));
        page.drawText(line, {
          x: at.x,
          y: at.y,
          size: item.size,
          font,
          color: color(item.color),
          rotate: degrees(-spin),
        });
      });
      continue;
    }

    if (item.type === "draw") {
      for (let i = 1; i < item.points.length; i++) {
        const a = up(item.points[i - 1][0], item.points[i - 1][1]);
        const b = up(item.points[i][0], item.points[i][1]);
        page.drawLine({
          start: a,
          end: b,
          thickness: item.width,
          color: color(item.color),
          opacity: item.opacity,
          lineCap: 1 /* round, so a stroke reads as one line not a chain */,
        });
      }
      continue;
    }

    const embedded = item.png
      ? await doc.embedPng(item.bytes)
      : await doc.embedJpg(item.bytes);
    /* drawImage measures from the bottom-left, the editor from the top-left. */
    const at = up(item.x, item.y + item.h);
    page.drawImage(embedded, {
      x: at.x,
      y: at.y,
      width: item.w,
      height: item.h,
      rotate: degrees(-spin),
    });
  }

  doc.setModificationDate(new Date());
  return {
    name: `${base(file.name)}-edited.pdf`,
    blob: pdfBlob(await doc.save()),
  };
}
