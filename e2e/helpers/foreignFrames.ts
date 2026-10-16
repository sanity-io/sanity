/**
 * A page can show documents of other origins in child frames, such as the Presentation preview,
 * which the e2e studio loads from the deployment of `dev/preview-iframe` built from `main`. What
 * goes wrong in them is not the studio's doing, nor anything the change under test can fix, so the
 * studio error watcher (`studioErrors.ts`) leaves them out.
 */

/**
 * Chromium reports a blocked cross-origin access without a location, but names the origin of the
 * frame that attempted it.
 */
const BLOCKED_FRAME_ACCESS = /Blocked a frame with origin "([^"]+)" from accessing/

/** The URLs of a page's documents when an event arrives. */
export interface PageFrameUrls {
  main: string
  /** Every frame but the main one, nested frames included. */
  children: string[]
}

/** `null` for URLs without an origin of their own: `about:blank`, `data:`, an empty location. */
export function originOf(url: string): string | null {
  if (!URL.canParse(url)) return null
  const {origin} = new URL(url)
  return origin === 'null' ? null : origin
}

/** Whether the document at `documentUrl` has another origin than the page at `pageUrl`. */
export function isForeignDocument(documentUrl: string, pageUrl: string): boolean {
  const origin = originOf(documentUrl)
  const pageOrigin = originOf(pageUrl)
  return origin !== null && pageOrigin !== null && origin !== pageOrigin
}

/**
 * Whether an uncaught error or a console message came from a child frame of another origin than
 * the page. `url` is the location of the script that threw or logged it. A studio loads scripts
 * from other origins too (the CDN of auto-updating studios), so it only counts as foreign when a
 * child frame of the page has that origin.
 */
export function isFromForeignFrame(
  source: {url: string; message: string},
  frames: PageFrameUrls,
): boolean {
  const origin =
    originOf(source.url) ?? originOf(BLOCKED_FRAME_ACCESS.exec(source.message)?.[1] ?? '')
  const pageOrigin = originOf(frames.main)
  if (origin === null || pageOrigin === null || origin === pageOrigin) return false
  return frames.children.some((url) => originOf(url) === origin)
}
