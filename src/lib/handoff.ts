/**
 * A File cannot be serialised into a URL or sessionStorage, and every route
 * change here is client-side, so the home page hands a dropped file to the
 * tool it launches through this module-level slot. The tool takes it on mount
 * and clears it; anything left behind is dropped on a full page load, which
 * is the behaviour we want — a reload should start clean.
 */
export const handoff: { files: File[] | null } = { files: null };

export function takeHandoff(): File[] | null {
  const files = handoff.files;
  handoff.files = null;
  return files;
}
