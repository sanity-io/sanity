/**
 * The style probe: a census of which styling systems the rendered page is
 * built from (`@sanity/ui` v5 vs v4 nodes, styled-components nodes) and how
 * much CSS styled-components inserted at runtime. Bundled at runner startup
 * (runner/inject.ts, `bundleStyleProbe`) and evaluated once per session
 * against the open document (runner/session/styles.ts) — never installed as
 * an init script, so the shared collector in ./index.ts stays untouched.
 *
 * `takeStyleCensus` is a re-export on purpose: the fingerprints and the
 * counting live in @repo/utils so the bench records exactly the numbers the
 * test studio's "Style migrations" widget shows
 * (dev/test-studio/plugins/style-outline). The bundle is self-contained, so
 * the probe measures historical studio builds (backfill and A/B references)
 * that predate any of this code.
 */
export {takeStyleCensus} from '@repo/utils/style-systems'

/**
 * Resolve once the DOM has stopped mutating for `quietMs` (true), or after
 * `timeoutMs` without such a window (false).
 *
 * The census must be taken on a quiet page: readiness — the form accepting a
 * keystroke — precedes the last lazy panes by a second or two, during which
 * the node counts more than double (singleString: 271 → 901 `@sanity/ui`
 * nodes, measured). A census at readiness would count a different page than
 * one taken later in the same session, and the interaction and pageload
 * shards of a scenario would disagree about the same build.
 */
export function waitForDomQuiet(
  root: Document,
  quietMs: number,
  timeoutMs: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    let quietTimer: ReturnType<typeof setTimeout> | undefined
    const observer = new MutationObserver(() => arm())
    const finish = (quiet: boolean) => {
      observer.disconnect()
      clearTimeout(quietTimer)
      clearTimeout(deadline)
      resolve(quiet)
    }
    const deadline = setTimeout(() => finish(false), timeoutMs)
    const arm = () => {
      clearTimeout(quietTimer)
      quietTimer = setTimeout(() => finish(true), quietMs)
    }
    observer.observe(root.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })
    arm()
  })
}
