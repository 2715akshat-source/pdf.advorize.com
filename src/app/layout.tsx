import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import TransitionProvider from "@/components/TransitionProvider";
import Feedback from "@/components/Feedback";
import Analytics from "@/components/Analytics";
import JsonLd from "@/components/JsonLd";
import { BRAND, SITE_URL, buildMetadata } from "@/lib/seo";
import { graph, organizationSchema, websiteSchema } from "@/lib/schema";

const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  ...buildMetadata({ path: "/" }),
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND} — Free Browser-Based PDF Tools, No Upload`,
    template: `%s | ${BRAND}`,
  },
  applicationName: BRAND,
  icons: { icon: "/favicon-mark.png" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Applies the saved theme before the first paint, so someone who chose dark
 * on advorize.com never sees a white flash on the way in. Same storage key as
 * the main site, which shares the apex domain.
 */
const THEME = `(function(){try{
var t=localStorage.getItem('advorize:theme');
if(t){document.documentElement.setAttribute('data-theme',t);}
}catch(e){}})();`;

/**
 * First-landing intro curtain, straight from the main site: the flag goes on
 * <html> before the page is parsed so the panels are covering on the very
 * first paint, and the markup itself is rendered by React like anything else.
 * Plays once per tab session, and skips itself for reduced-motion visitors.
 */
const INTRO = `(function(){try{
if(sessionStorage.getItem('advorize:intro'))return;
sessionStorage.setItem('advorize:intro','1');
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var d=document;
d.documentElement.setAttribute('data-intro','');
setTimeout(function(){d.documentElement.removeAttribute('data-intro');},1800);
}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <JsonLd data={graph([organizationSchema(), websiteSchema()])} />
        <Analytics />

        <script dangerouslySetInnerHTML={{ __html: THEME }} />
        <script dangerouslySetInnerHTML={{ __html: INTRO }} />

        <div className="intro" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="intro-panel"
              style={{ animationDelay: `${0.85 + i * 0.06}s` }}
            />
          ))}
          <span className="intro-label" aria-hidden>
            <span className="intro-wordmark" />
          </span>
        </div>

        <SmoothScroll />
        <Cursor />
        <TransitionProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
          <Feedback />
        </TransitionProvider>
      </body>
    </html>
  );
}
