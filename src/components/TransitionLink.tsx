"use client";

import type { ReactNode } from "react";
import { useTransitionNav } from "./TransitionProvider";

/**
 * Drop-in replacement for <Link> that plays the curtain transition
 * before the route actually changes. Falls back to normal behaviour
 * for external links and mailto:.
 */
export default function TransitionLink({
  href,
  children,
  className,
  onNavigate,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const navigate = useTransitionNav();
  const external = /^(https?:|mailto:|tel:)/.test(href);

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (external || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        onNavigate?.();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
