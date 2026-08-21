import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
