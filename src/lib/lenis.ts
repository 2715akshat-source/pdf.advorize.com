import type Lenis from "lenis";

/**
 * Shared handle on the Lenis instance so route changes can jump the
 * smooth-scroll container back to the top.
 */
export const lenisRef: { current: Lenis | null } = { current: null };
