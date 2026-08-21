"use client";

import Script from "next/script";
import { GA_ID } from "@/lib/analytics";

/**
 * Google Analytics 4.
 *
 * Route changes here go through `router.push`, which is a history event, and
 * GA4's enhanced measurement counts those as page views — so the standard
 * snippet is the whole integration and firing our own `page_view` on top
 * would double-count every navigation.
 *
 * It is left out of development builds, so local clicking around does not
 * land in the property alongside real traffic.
 */
export default function Analytics() {
  if (process.env.NODE_ENV !== "production" || !GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
