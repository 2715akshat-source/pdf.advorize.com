import type { NextConfig } from "next";

/*
 * Deployments normalise file timestamps for reproducible builds — on Vercel
 * every file comes back as 2018-10-20 — so an mtime cannot date a page in
 * production. This is baked in at build time and used wherever a file date
 * turns out to be one of those placeholders.
 */
const BUILD_TIME = new Date().toISOString();

const nextConfig: NextConfig = {
  env: { BUILD_TIME },

  /* Every tool runs in the browser, so every page is static. */
  reactStrictMode: true,

  /*
   * The sitemap is generated at request time by walking the app directory
   * (see src/lib/routes.ts), so the source of those routes has to travel with
   * the deployment — tracing would otherwise leave it behind, since nothing
   * imports it in a way the bundler can see.
   */
  outputFileTracingIncludes: {
    "/sitemap.xml": ["./src/app/**/page.tsx", "./src/lib/tools.ts"],
  },

  /*
   * The watermark remover's AI fill runs on WebAssembly threads, and the
   * browser only hands out threads to a cross-origin-isolated page — about
   * five times faster than one thread. `credentialless` keeps third-party
   * scripts loading without asking every CDN to opt in. Only this page gets
   * it; nothing else needs threads.
   */
  async headers() {
    return [
      {
        source: "/remove-watermark",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },

  /*
   * Slugs people and other sites guess at. A permanent redirect keeps the
   * link working without publishing a second URL for the same page, which is
   * what an alias would be.
   */
  async redirects() {
    return [
      { source: "/remove-pdf-pages", destination: "/remove-pages-from-pdf", permanent: true },
      { source: "/delete-pdf-pages", destination: "/remove-pages-from-pdf", permanent: true },
      { source: "/pdf-editor", destination: "/edit-pdf", permanent: true },
      { source: "/esign-pdf", destination: "/sign-pdf", permanent: true },
      { source: "/rearrange-pdf", destination: "/organize-pdf", permanent: true },
      { source: "/image-to-pdf", destination: "/jpg-to-pdf", permanent: true },
      { source: "/pdf-to-image", destination: "/pdf-to-jpg", permanent: true },
      { source: "/free-pdf-tools", destination: "/free-pdf-tools-no-signup", permanent: true },
    ];
  },
};

export default nextConfig;
