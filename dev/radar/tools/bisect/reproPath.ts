/**
 * A bisect session can carry a "repro path": where inside the test studio
 * the issue reproduces (a document, a tool, a query string). Every preview
 * build the tool proposes opens at that path, so the tester doesn't navigate
 * there by hand at each step.
 */

/** Never a real host — only there to give relative input something to resolve against. */
const SENTINEL_BASE = 'https://repro-path.invalid'

/**
 * Normalize what a user typed into a same-origin path. Accepts a bare path
 * (`test/desk/author`, `/test/desk/author?x=1#y`) or a full test-studio URL
 * copied from the address bar (only its path, query and hash are kept).
 * Returns `undefined` for blank input.
 *
 * The input is run through the WHATWG URL parser rather than pattern-matched:
 * whatever it was — a full URL, a protocol-relative `//host`, a
 * backslash-prefixed `\\host` (which the parser reads as slashes), a bare
 * `javascript:` scheme — only the parsed path, query and hash survive. The
 * parser keeps empty leading segments (`//x` stays `//x`), so those are
 * collapsed to one slash or the result would read as protocol-relative when
 * resolved against a preview URL. `withReproPath` re-checks the origin anyway.
 */
export function normalizeReproPath(input: string): string | undefined {
  const value = input.trim()
  if (!value) return undefined
  let url: URL
  try {
    url = new URL(value, SENTINEL_BASE)
  } catch {
    return undefined
  }
  const path = `/${url.pathname.replace(/^\/+/, '')}${url.search}${url.hash}`
  return path === '/' ? undefined : path
}

/** The preview build opened at the session's repro path (or as-is when there is none). */
export function withReproPath(testStudioUrl: string, reproPath: string | undefined): string {
  const path = reproPath ? normalizeReproPath(reproPath) : undefined
  if (!path) return testStudioUrl
  // Both inputs are stored data: the preview URL is only prefix-checked at
  // the query boundary (toBisectCommit), so a malformed sync value must not
  // take the tool down — fall back to the link as it was. And a normalized
  // path cannot change the origin, but this is the one place a link is
  // built from that data, so check rather than trust
  try {
    const base = new URL(testStudioUrl)
    const url = new URL(path, base)
    return url.origin === base.origin ? url.toString() : testStudioUrl
  } catch {
    return testStudioUrl
  }
}
