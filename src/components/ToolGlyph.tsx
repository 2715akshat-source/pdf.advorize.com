"use client";

import { motion } from "framer-motion";

/**
 * A line drawing per tool, in the same hand as the service illustrations on
 * advorize.com: one flat 120×90 viewBox, everything in `currentColor`, and
 * nothing moves until the parent says so.
 *
 * The parent drives them by setting `initial="rest"` and `whileHover="active"`
 * (or `animate`) — each glyph is built so its `active` state *performs the
 * operation*: the two pages in Merge slide together, the one page in Split
 * comes apart, Rotate turns a quarter. The picture is the explanation.
 */

const PAGE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinejoin: "round" as const,
};

const ease = [0.16, 1, 0.3, 1] as const;
const spring = { duration: 0.7, ease };

/** Scales a drawing about the centre of the frame, so a single sheet reads at
    the same weight as the two-sheet compositions that fill it naturally. */
function Big({ children }: { children: React.ReactNode }) {
  return (
    <g transform="translate(60 23) scale(1.3) translate(-60 -23)">{children}</g>
  );
}

/** A sheet of paper with a folded corner and a couple of text rules. */
function Sheet({ lines = 2 }: { lines?: number }) {
  return (
    <>
      <path d="M4 3 h22 l8 8 v30 h-30 z" {...PAGE} />
      <path d="M26 3 v8 h8" {...PAGE} />
      {Array.from({ length: lines }).map((_, i) => (
        <line
          key={i}
          x1="10"
          y1={20 + i * 7}
          x2={i % 2 ? 24 : 29}
          y2={20 + i * 7}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />
      ))}
    </>
  );
}

/** Two sheets that close the gap between them. */
function Merge() {
  return (
    <>
      <motion.g
        variants={{ rest: { x: 6 }, active: { x: 24 } }}
        transition={spring}
      >
        <Sheet />
      </motion.g>
      <motion.g
        variants={{ rest: { x: 74 }, active: { x: 56 } }}
        transition={spring}
      >
        <Sheet />
      </motion.g>
    </>
  );
}

/** One sheet that splits into two halves. */
function Split() {
  return (
    <>
      {/* at rest the two halves overlap, with the cut drawn between them —
          otherwise this is indistinguishable from a single sheet */}
      <motion.g
        variants={{ rest: { x: 34, y: 0 }, active: { x: 14, y: -3 } }}
        transition={spring}
      >
        <Sheet />
      </motion.g>
      <motion.g
        variants={{ rest: { x: 50, y: 0 }, active: { x: 70, y: 6 } }}
        transition={spring}
      >
        <Sheet />
      </motion.g>
      <motion.line
        x1="60"
        y1="0"
        x2="60"
        y2="46"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
        variants={{ rest: { opacity: 0.5 }, active: { opacity: 0 } }}
        transition={spring}
      />
    </>
  );
}

/** A sheet squeezed by two arrows. */
function Compress() {
  return (
    <>
      <motion.g
        variants={{ rest: { scale: 1 }, active: { scale: 0.82 } }}
        transition={spring}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <g transform="translate(42 0)">
          <Sheet />
        </g>
      </motion.g>
      {[
        { d: "M18 22 h14 m-6 -5 l6 5 l-6 5", rest: -8 },
        { d: "M102 22 h-14 m6 -5 l-6 5 l6 5", rest: 8 },
      ].map((a, i) => (
        <motion.path
          key={i}
          d={a.d}
          {...PAGE}
          strokeLinecap="round"
          variants={{ rest: { x: a.rest, opacity: 0.4 }, active: { x: 0, opacity: 1 } }}
          transition={spring}
        />
      ))}
    </>
  );
}

/** A sheet that turns a quarter, with an arc showing the way round. */
function Rotate() {
  return (
    <Big>
      <motion.g
        variants={{ rest: { rotate: 0 }, active: { rotate: 90 } }}
        transition={{ duration: 0.8, ease }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <g transform="translate(42 0)">
          <Sheet />
        </g>
      </motion.g>
      {/* the arc, with its arrowhead, is what says "rotate" while at rest */}
      <motion.path
        d="M88 8 a18 18 0 0 1 4 20"
        {...PAGE}
        strokeLinecap="round"
        variants={{ rest: { pathLength: 1, opacity: 0.45 }, active: { pathLength: 1, opacity: 1 } }}
        transition={spring}
      />
      <path d="M86 12 l2 -5 l5 2" {...PAGE} strokeLinecap="round" opacity="0.6" />
    </Big>
  );
}

/** A page lifted out of a stack — extract, or its inverse, delete. */
function Pull({ away }: { away: boolean }) {
  return (
    <>
      {/* the badge is the only thing separating these two at rest, so it
          carries the difference: a cross for delete, an arrow for extract */}
      <g transform="translate(96 14)">
        <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.12" />
        {away ? (
          <path d="M5 5 l6 6 M11 5 l-6 6" {...PAGE} strokeLinecap="round" />
        ) : (
          <path d="M8 12 v-8 m-3 3 l3 -3 l3 3" {...PAGE} strokeLinecap="round" />
        )}
      </g>
      <g transform="translate(28 0)" opacity="0.35">
        <Sheet lines={1} />
      </g>
      <g transform="translate(46 0)" opacity="0.35">
        <Sheet lines={1} />
      </g>
      <motion.g
        variants={{
          rest: { x: 64, y: 0, opacity: 1 },
          active: { x: away ? 88 : 64, y: away ? -8 : -12, opacity: away ? 0.15 : 1 },
        }}
        transition={spring}
      >
        <Sheet />
      </motion.g>
    </>
  );
}

/** Three numbered pages that swap places. */
function Reorder({ reverse }: { reverse?: boolean }) {
  const slots = [22, 42, 62];
  const order = reverse ? [2, 1, 0] : [1, 2, 0];
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          variants={{
            rest: { x: slots[i], y: 0 },
            active: { x: slots[order[i]], y: i === 0 ? -6 : 0 },
          }}
          transition={{ ...spring, delay: i * 0.05 }}
        >
          <Sheet lines={1} />
        </motion.g>
      ))}

      {reverse ? (
        /* a return arrow: the whole document turning round */
        <g transform="translate(96 12)">
          <path d="M2 6 a9 9 0 1 1 3 12" {...PAGE} strokeLinecap="round" opacity="0.6" />
          <path d="M0 2 l2 5 l5 -2" {...PAGE} strokeLinecap="round" opacity="0.6" />
        </g>
      ) : (
        /* three ticks that say "an order you choose" */
        <g opacity="0.45">
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={100} cy={12 + i * 9} r="2.5" fill="currentColor" />
          ))}
        </g>
      )}
    </>
  );
}

/** A sheet becoming a picture — the convert family. */
function Convert({ reverse }: { reverse?: boolean }) {
  return (
    <>
      <motion.g
        variants={{ rest: { x: reverse ? 66 : 20 }, active: { x: reverse ? 66 : 20, opacity: 1 } }}
      >
        <Sheet />
      </motion.g>

      <motion.path
        d="M56 22 h12 m-5 -5 l5 5 l-5 5"
        {...PAGE}
        strokeLinecap="round"
        variants={{ rest: { opacity: 0.35, x: -4 }, active: { opacity: 1, x: 2 } }}
        transition={spring}
        transform={reverse ? "translate(120 44) rotate(180)" : undefined}
      />

      {/* the image: a frame with a horizon and a sun */}
      <motion.g
        variants={{ rest: { scale: 0.9, opacity: 0.5 }, active: { scale: 1, opacity: 1 } }}
        transition={spring}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        transform={`translate(${reverse ? 18 : 70} 3)`}
      >
        <rect x="0" y="0" width="32" height="38" rx="4" {...PAGE} />
        <circle cx="10" cy="12" r="4" {...PAGE} />
        <path d="M2 30 l9 -10 l7 8 l5 -5 l7 8" {...PAGE} strokeLinecap="round" />
      </motion.g>
    </>
  );
}

/** A sheet with a number badge that counts on. */
function Numbers() {
  return (
    <Big>
      <g transform="translate(42 0)">
        <Sheet />
      </g>
      <motion.g
        variants={{ rest: { opacity: 0.35, y: 4 }, active: { opacity: 1, y: 0 } }}
        transition={spring}
      >
        <circle cx="60" cy="37" r="7" fill="currentColor" />
      </motion.g>
      {[36, 84].map((x, i) => (
        <motion.text
          key={x}
          x={x}
          y="41"
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
          variants={{ rest: { opacity: 0 }, active: { opacity: 0.35 } }}
          transition={{ ...spring, delay: 0.1 + i * 0.05 }}
        >
          {i ? "3" : "1"}
        </motion.text>
      ))}
    </Big>
  );
}

/** A sheet with a diagonal stamp across it. */
function Watermark() {
  return (
    <Big>
      <g transform="translate(42 0)">
        <Sheet />
      </g>
      <motion.line
        x1="46"
        y1="38"
        x2="76"
        y2="8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        variants={{ rest: { pathLength: 0, opacity: 0 }, active: { pathLength: 1, opacity: 0.55 } }}
        transition={{ duration: 0.6, ease }}
      />
    </Big>
  );
}

/** Crop marks closing in on a sheet. */
function Crop() {
  return (
    <Big>
      <g transform="translate(42 0)" opacity="0.4">
        <Sheet />
      </g>
      <motion.path
        d="M50 12 v22 h22"
        {...PAGE}
        strokeLinecap="round"
        variants={{ rest: { x: -6, y: -6, opacity: 0.5 }, active: { x: 0, y: 0, opacity: 1 } }}
        transition={spring}
      />
      <motion.path
        d="M70 34 v-22 h-22"
        {...PAGE}
        strokeLinecap="round"
        variants={{ rest: { x: 6, y: 6, opacity: 0.5 }, active: { x: 0, y: 0, opacity: 1 } }}
        transition={spring}
      />
    </Big>
  );
}

/** A padlock whose shackle springs open. */
function Unlock() {
  return (
    <Big>
      <g transform="translate(42 0)" opacity="0.35">
        <Sheet lines={1} />
      </g>
      <rect x="50" y="22" width="22" height="17" rx="4" {...PAGE} />
      <motion.path
        d="M55 22 v-5 a6 6 0 0 1 12 0 v5"
        {...PAGE}
        strokeLinecap="round"
        variants={{ rest: { rotate: 0, x: 0 }, active: { rotate: -22, x: 3 } }}
        transition={spring}
        style={{ transformBox: "fill-box", transformOrigin: "bottom left" }}
      />
    </Big>
  );
}

/** Layers pressing down into one — flatten and greyscale. */
function Flatten({ tone }: { tone?: boolean }) {
  return (
    <Big>
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          variants={{
            rest: { y: i * -7, opacity: tone ? 0.3 + i * 0.25 : 1 },
            active: { y: 0, opacity: tone ? 1 : 1 },
          }}
          transition={{ ...spring, delay: i * 0.05 }}
        >
          <g transform="translate(42 8)">
            <Sheet lines={1} />
          </g>
        </motion.g>
      ))}
    </Big>
  );
}

/** A sheet whose ruled lines lift off as loose text. */
function TextOut() {
  return (
    <>
      <g transform="translate(28 0)">
        <Sheet lines={3} />
      </g>
      {[0, 1, 2].map((i) => (
        <motion.rect
          key={i}
          x="72"
          y={16 + i * 8}
          width={i === 1 ? 14 : 22}
          height="3"
          rx="1.5"
          fill="currentColor"
          variants={{
            rest: { opacity: 0, x: -12 },
            active: { opacity: 0.55, x: 0 },
          }}
          transition={{ ...spring, delay: 0.05 + i * 0.07 }}
        />
      ))}
    </>
  );
}

/** A sheet with a tag hanging off it. */
function Meta() {
  return (
    <Big>
      <g transform="translate(34 0)">
        <Sheet lines={1} />
      </g>
      <motion.g
        variants={{ rest: { rotate: -12, opacity: 0.5 }, active: { rotate: 0, opacity: 1 } }}
        transition={spring}
        style={{ transformBox: "fill-box", transformOrigin: "left center" }}
      >
        <path d="M72 14 l14 0 l6 8 l-6 8 l-14 0 z" {...PAGE} />
        <circle cx="78" cy="22" r="2" fill="currentColor" />
      </motion.g>
    </Big>
  );
}

/** A pen writing a line onto a sheet. */
function Edit() {
  return (
    <Big>
      <g transform="translate(34 0)">
        <Sheet lines={2} />
      </g>
      {/* the nib travels along the line it is drawing */}
      <motion.g
        variants={{ rest: { x: 0 }, active: { x: 14 } }}
        transition={spring}
      >
        <path d="M74 30 l12 -12 l5 5 l-12 12 l-6 1 z" {...PAGE} strokeLinecap="round" />
        <path d="M84 20 l5 5" {...PAGE} strokeLinecap="round" />
      </motion.g>
      <motion.line
        x1="60"
        y1="36"
        x2="84"
        y2="36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        variants={{ rest: { pathLength: 0, opacity: 0 }, active: { pathLength: 1, opacity: 0.5 } }}
        transition={spring}
      />
    </Big>
  );
}

const GLYPHS: Record<string, React.ReactNode> = {
  "edit-pdf": <Edit />,
  "merge-pdf": <Merge />,
  "split-pdf": <Split />,
  "compress-pdf": <Compress />,
  "rotate-pdf": <Rotate />,
  "remove-pages-from-pdf": <Pull away />,
  "extract-pdf-pages": <Pull away={false} />,
  "organize-pdf": <Reorder />,
  "reverse-pdf": <Reorder reverse />,
  "pdf-to-jpg": <Convert />,
  "pdf-to-png": <Convert />,
  "jpg-to-pdf": <Convert reverse />,
  "png-to-pdf": <Convert reverse />,
  "add-page-numbers": <Numbers />,
  "watermark-pdf": <Watermark />,
  "crop-pdf": <Crop />,
  "flatten-pdf": <Flatten />,
  "grayscale-pdf": <Flatten tone />,
  "pdf-to-text": <TextOut />,
  "edit-pdf-metadata": <Meta />,
  "unlock-pdf": <Unlock />,
};

export default function ToolGlyph({
  slug,
  className,
  play = false,
}: {
  slug: string;
  className?: string;
  /** Runs the operation once when the drawing scrolls into view, then holds
      it — used on the tool pages, where there is nothing to hover. */
  play?: boolean;
}) {
  return (
    <motion.svg
      viewBox="0 0 120 46"
      className={className}
      fill="none"
      aria-hidden
      focusable="false"
      initial="rest"
      {...(play
        ? {
            whileInView: "active",
            viewport: { once: true, margin: "-10%" },
            transition: { delay: 0.6 },
          }
        : {})}
    >
      {GLYPHS[slug] ?? <Merge />}
    </motion.svg>
  );
}
