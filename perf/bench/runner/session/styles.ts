import {type StyleCensus} from '@repo/utils/style-systems'
import {type Page} from 'playwright'

import {STYLE_PROBE_GLOBAL} from '../inject'

/** A full second without a DOM mutation, or `DOM_QUIET_TIMEOUT_MS` of trying — see waitForDomQuiet. */
const DOM_QUIET_MS = 1000
const DOM_QUIET_TIMEOUT_MS = 10_000

/**
 * Take the style census of the page once it has gone quiet — see
 * `takeStyleCensus` in @repo/utils/style-systems for what is counted, and
 * `waitForDomQuiet` in instrumentation/styles.ts for why the wait matters
 * (the last lazy panes land a second or two after readiness and double the
 * node counts). A page still mutating after the timeout is measured as it
 * is: the median over sessions absorbs a straggler, and settle mode is the
 * detector for pages that never go quiet.
 *
 * `probe` is the bundle from `bundleStyleProbe`. It is evaluated inside a
 * closure so the bundle's global never leaks into the page, and as source
 * text rather than a function: tsx's esbuild transform injects `__name`
 * helpers into multi-statement function bodies, which do not exist in the
 * page scope (the same reason the evaluate callbacks in interaction.ts are
 * single expressions).
 *
 * Null when the probe fails. The census is report-only context on a session
 * that otherwise succeeded; a broken probe must not discard the latency
 * samples the session exists for. Callers warn so the gap is visible.
 */
export async function takePageStyleCensus(page: Page, probe: string): Promise<StyleCensus | null> {
  try {
    const census = await page.evaluate(
      `(async () => {\n${probe}\n` +
        `await ${STYLE_PROBE_GLOBAL}.waitForDomQuiet(document, ${DOM_QUIET_MS}, ${DOM_QUIET_TIMEOUT_MS})\n` +
        `return ${STYLE_PROBE_GLOBAL}.takeStyleCensus(document)\n})()`,
    )
    return census as StyleCensus
  } catch {
    return null
  }
}

/**
 * One line of the census for the run log, in the widget's own words: the UI
 * v5 adoption share and the styled-components escape count.
 */
export function describeStyleCensus(census: StyleCensus): string {
  const {nodes} = census
  const uiTotal = nodes.ui5 + nodes.ui4
  const adoption = !census.ui5Available
    ? 'UI v5 not in this build'
    : uiTotal === 0
      ? 'no @sanity/ui nodes'
      : `UI v5 ${((nodes.ui5 / uiTotal) * 100).toFixed(0)}% (${nodes.ui5} v5 / ${nodes.ui4} v4)`
  const {cssRules} = census.styledComponents
  const ruleShare =
    census.stylesheets.totalRules > 0
      ? ` · ${((cssRules / census.stylesheets.totalRules) * 100).toFixed(0)}% of CSS rules`
      : ''
  const version =
    census.styledComponents.versions.length > 0
      ? ` (v${census.styledComponents.versions.join(', v')})`
      : ''
  return `${adoption}; styled-components ${nodes.styled} instances, ${census.styledComponents.components} components${ruleShare}${version}`
}
