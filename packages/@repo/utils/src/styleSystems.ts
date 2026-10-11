/**
 * Style-system fingerprints and the DOM census built on them: the one place
 * that defines what counts as an `@sanity/ui` v5 node, an `@sanity/ui` v4
 * node or a styled-components node, and how much CSS styled-components has
 * inserted at runtime. Shared so every surface that reports on the studio's
 * style migrations agrees on its numbers:
 *
 * - the test studio's "Style migrations" widget
 *   (dev/test-studio/plugins/style-outline) draws the census live and paints
 *   debug outlines from the same selectors;
 * - the perf bench's style probe (perf/bench/instrumentation/styles.ts)
 *   records the census once per benchmark session, as metric rows on the run
 *   document (`STYLE_METRICS` holds the labels — the join key with Studio
 *   Radar, dev/radar, which charts them over time).
 *
 * The CSS weight block (`css`) counts every readable stylesheet on the page —
 * `<link>` sheets, `<style>` elements (styled-components included) and
 * constructed sheets — so the total drops when a runtime-styled library goes,
 * not only its own share.
 *
 * The styled-components sheet numbers mirror the studio diagnostics dialog
 * (packages/sanity/src/core/studio/diagnostics/getStylesDiagnostics.ts): rule
 * count of every `<style data-styled>` sheet, UTF-8 size of its CSS, and the
 * runtime version stamped on the element. Kept as a copy rather than an
 * import on purpose: the bench injects this code into *historical* studio
 * builds, which have no such module to import.
 *
 * Browser-only DOM code with no node imports. Import from
 * `@repo/utils/style-systems`, not the package index.
 */

export type StyleSystemId = 'ui5' | 'ui4' | 'styled'

export interface StyleSystem {
  id: StyleSystemId
  label: string
  /** Swatch color, shared by the widget's outlines and Radar's charts. */
  color: string
  /** CSS selector matching the nodes this system rendered. */
  selector: string
}

interface Fingerprint extends Omit<StyleSystem, 'selector'> {
  exclude?: readonly string[]
  match: string
}

const UI5_MATCH = '[class^="sui-"], [class*=" sui-"]'
const UI4_MATCH = '[data-ui]'
const UI4_ONLY_MATCH = `:is(${UI4_MATCH}):not(${UI5_MATCH})`

// UI v5 and styled-components may coexist on the same node while it is being migrated, so those
// fingerprints deliberately overlap, even if the v5 node also has data-ui. UI v4 still yields to
// v5 in the adoption count, and resolved v4 nodes remain excluded from the styled-components count.
const FINGERPRINTS: readonly Fingerprint[] = [
  {
    id: 'ui5',
    label: '@sanity/ui v5',
    color: '#3fb950',
    match: UI5_MATCH,
  },
  {
    id: 'ui4',
    label: '@sanity/ui v4',
    color: '#e2604f',
    exclude: [UI5_MATCH],
    match: UI4_MATCH,
  },
  {
    id: 'styled',
    label: 'styled-components',
    color: '#ff4fa3',
    exclude: [UI4_ONLY_MATCH],
    // Prebuilt studio bundles emit `<Name>-sc-<hash>` ids; `sanity dev` resolves the studio from
    // source without the styled-components transform, so ids are bare `sc-<hash>` tokens.
    match: '[class*="-sc-"], [class^="sc-"], [class*=" sc-"]',
  },
]

export const STYLE_SYSTEMS: readonly StyleSystem[] = FINGERPRINTS.map(
  ({exclude = [], match, ...system}) => {
    const exclusions = exclude.length > 0 ? `:not(${exclude.join(', ')})` : ''
    return {...system, selector: `:is(${match})${exclusions}`}
  },
)

/**
 * The class-token form of the styled-components fingerprint above: a styled
 * component stamps its component id (`sc-<hash>`, or `<Name>-sc-<hash>` when
 * built with the transform) on every element it renders, next to the
 * per-style class. Distinct ids therefore count distinct component
 * definitions, where matching nodes count instances.
 */
const STYLED_COMPONENT_ID = /(^|-)sc-/

/** `@sanity/ui` v5 ships its stylesheet in the `sui` cascade layer. */
const UI5_LAYER = /^sui(\.|$)/

export interface StyleCensus {
  /** Rendered nodes per style system, by the `STYLE_SYSTEMS` fingerprints. */
  nodes: Record<StyleSystemId, number>
  /**
   * Whether the page's build ships `@sanity/ui` v5 at all — its `sui` cascade
   * layer is in a stylesheet, or a v5 node is rendered. A v5 count of zero on
   * a build without it means "not applicable", not "nothing migrated yet":
   * studio releases before v6.10 never had v5 to adopt.
   */
  ui5Available: boolean
  styledComponents: {
    /** Distinct styled component definitions among the rendered nodes (unique component ids). */
    components: number
    /** `<style data-styled>` elements — one per styled-components runtime on the page. */
    styleTags: number
    /** CSS rules those sheets hold: the diagnostics dialog's "CSS rules inserted by JS". */
    cssRules: number
    /** UTF-8 bytes of that CSS: "CSS size inserted by JS". */
    cssBytes: number
    /** `data-styled-version` values seen, deduplicated (more than one means two runtimes). */
    versions: string[]
  }
  stylesheets: {
    /** Readable CSS rules across every stylesheet on the page, styled-components included. */
    totalRules: number
    /** Stylesheets whose rules could not be read (cross-origin). */
    inaccessible: number
  }
  /**
   * How much CSS the page holds, across every readable stylesheet. Rules are
   * counted inside grouping at-rules (`@layer`, `@media`, `@supports`, …), so a
   * sheet wrapped in one `@layer` block counts its rules, not 1 — unlike
   * `stylesheets.totalRules`, which counts top-level rules only. Bytes are the
   * UTF-8 size of the serialized rules (the CSSOM's `cssText`): what the
   * browser parsed and holds, not what went over the wire, so a `<style>` tag
   * filled at runtime and a downloaded file are measured the same way.
   *
   * Blind spots, none of which the built studio hits today: unreadable
   * (cross-origin) sheets are left out, so a page with some is undercounted
   * (see `stylesheets.inaccessible`); `@import`ed sheets are not in
   * `document.styleSheets` and the `@import` rule counts as one; shadow roots'
   * `adoptedStyleSheets` are not visited; a `@layer a, b;` statement counts as
   * a rule.
   */
  css: {
    /** Readable stylesheets the numbers below were read from. */
    sheets: number
    rules: number
    bytes: number
    /** The share held by `<style>` elements (styled-components' included): CSS the page inserted rather than linked. */
    styleTags: {rules: number; bytes: number}
  }
}

function readRules(sheet: CSSStyleSheet): CSSRuleList | null {
  try {
    return sheet.cssRules
  } catch {
    // Cross-origin or otherwise inaccessible CSSOM sheets throw on `cssRules`.
    return null
  }
}

/**
 * Rules in `rules`, counted through grouping at-rules: a container
 * (`@media`, `@supports`, `@layer` block, `@container`, …) adds its children
 * but not itself, a style rule adds itself and any nested rules, and a
 * `@keyframes` block counts as one rule. Duck-typed on `cssRules` /
 * `selectorText` so it runs where the CSSOM rule constructors are missing.
 */
function countRules(rules: CSSRuleList): number {
  let count = 0
  for (const rule of Array.from(rules)) {
    if (!hasChildRules(rule) || 'findRule' in rule) {
      count += 1
      continue
    }
    count += ('selectorText' in rule ? 1 : 0) + countRules(rule.cssRules)
  }
  return count
}

function hasChildRules(rule: CSSRule): rule is CSSRule & {cssRules: CSSRuleList} {
  return 'cssRules' in rule && rule.cssRules != null
}

/**
 * Whether a sheet's top-level rules carry the `sui` cascade layer (statement
 * or block form). Duck-typed on the layer rule members rather than through
 * the `CSSLayer*Rule` globals so the check also runs where those constructors
 * are missing (jsdom), and without stringifying a whole layer block.
 */
function hasUi5Layer(rules: CSSRuleList): boolean {
  for (const rule of Array.from(rules)) {
    if ('nameList' in rule && Array.isArray(rule.nameList)) {
      if (rule.nameList.some((name) => typeof name === 'string' && UI5_LAYER.test(name))) {
        return true
      }
    } else if ('name' in rule && typeof rule.name === 'string' && UI5_LAYER.test(rule.name)) {
      return true
    }
  }
  return false
}

/** Take the census of `root`'s rendered nodes and stylesheets, as they are right now. */
export function takeStyleCensus(root: Document): StyleCensus {
  const nodes = Object.fromEntries(
    STYLE_SYSTEMS.map((system) => [system.id, root.querySelectorAll(system.selector).length]),
  ) as Record<StyleSystemId, number>

  const styledSelector = STYLE_SYSTEMS.find((system) => system.id === 'styled')!.selector
  const componentIds = new Set<string>()
  for (const element of Array.from(root.querySelectorAll(styledSelector))) {
    for (const token of Array.from(element.classList)) {
      if (STYLED_COMPONENT_ID.test(token)) componentIds.add(token)
    }
  }

  const versions = new Set<string>()
  let styleTags = 0
  for (const node of Array.from(root.querySelectorAll<HTMLStyleElement>('style[data-styled]'))) {
    styleTags += 1
    if (node.dataset.styledVersion) versions.add(node.dataset.styledVersion)
  }

  let cssRules = 0
  let cssBytes = 0
  let totalRules = 0
  let inaccessible = 0
  let ui5Layer = false
  const css = {sheets: 0, rules: 0, bytes: 0, styleTags: {rules: 0, bytes: 0}}
  const encoder = new TextEncoder()
  const sizeOf = (rules: CSSRuleList) =>
    encoder.encode(Array.from(rules, (rule) => rule.cssText).join('')).byteLength
  // Constructed sheets (`adoptedStyleSheets`) are not in `styleSheets`, but
  // they are CSS the page holds all the same
  const sheets = [...Array.from(root.styleSheets), ...(root.adoptedStyleSheets ?? [])]
  for (const sheet of sheets) {
    const rules = readRules(sheet)
    if (!rules) {
      inaccessible += 1
      continue
    }
    totalRules += rules.length
    css.sheets += 1
    const sheetRules = countRules(rules)
    const sheetBytes = sizeOf(rules)
    css.rules += sheetRules
    css.bytes += sheetBytes
    const owner = sheet.ownerNode
    if (owner instanceof HTMLStyleElement) {
      css.styleTags.rules += sheetRules
      css.styleTags.bytes += sheetBytes
    }
    if (owner instanceof HTMLStyleElement && owner.matches('style[data-styled]')) {
      cssRules += rules.length
      cssBytes += sheetBytes
    } else if (!ui5Layer) {
      ui5Layer = hasUi5Layer(rules)
    }
  }

  return {
    nodes,
    ui5Available: nodes.ui5 > 0 || ui5Layer,
    styledComponents: {
      components: componentIds.size,
      styleTags,
      cssRules,
      cssBytes,
      versions: [...versions].sort(),
    },
    stylesheets: {totalRules, inaccessible},
    css,
  }
}

/** `part` as a percentage of `total` (0–100, unrounded); null without a denominator. */
export function percentage(part: number, total: number): number | null {
  return total === 0 ? null : (part / total) * 100
}

/**
 * The UI v5 adoption headline: v5 nodes as a share of all `@sanity/ui` nodes
 * (v5 + v4). Null where it has no meaning — a build without v5 (see
 * `StyleCensus.ui5Available`; the answer there is "not applicable", never 0%)
 * or a page rendering no `@sanity/ui` at all.
 */
export function ui5Share(census: StyleCensus): number | null {
  if (!census.ui5Available) return null
  return percentage(census.nodes.ui5, census.nodes.ui5 + census.nodes.ui4)
}

/** styled-components' share of the page's readable CSS rules; null when nothing was readable. */
export function styledRuleShare(census: StyleCensus): number | null {
  return percentage(census.styledComponents.cssRules, census.stylesheets.totalRules)
}

export type StyleMetricUnit = 'count' | 'bytes' | 'percent'

export interface StyleMetric {
  /**
   * The metric label as stored on bench run documents — the join key between
   * perf/bench (which writes the rows) and dev/radar (which charts them).
   */
  label: string
  unit: StyleMetricUnit
  /** Which migration the metric tracks; `css` is the page's CSS weight, whatever wrote it. */
  track: 'ui5' | 'styled' | 'css'
  /** How to read a move: adoption climbs, the escape hatch shrinks. */
  goal: 'higher' | 'lower'
  /** Plain-English explanation, for chart ⓘ buttons. */
  description: string
  /**
   * False for a row that is recorded on the run document but never charted
   * (see the style-tags entry). Absent means charted.
   */
  charted?: boolean
  /**
   * Read the metric off a census. Null means "not applicable for this page or
   * build" and the row is left out — never written as zero.
   */
  read(census: StyleCensus): number | null
}

/**
 * Every style-migration metric the bench records, in display order. UI v5
 * adoption first (the headline share leading), then the styled-components
 * escape hatch, largest-picture numbers first, then the page's CSS weight.
 */
export const STYLE_METRICS: readonly StyleMetric[] = [
  {
    label: 'UI v5 share',
    unit: 'percent',
    track: 'ui5',
    goal: 'higher',
    description:
      'Rendered @sanity/ui components that are v5, as a share of all @sanity/ui components on the page (v5 ÷ (v5 + v4)). The headline of the UI v5 migration: 100% means every @sanity/ui component on the page is v5. Absent on builds that do not ship @sanity/ui v5 (studio releases before v6.10) — not applicable, not 0%.',
    read: ui5Share,
  },
  {
    label: 'UI v5 instances',
    unit: 'count',
    track: 'ui5',
    goal: 'higher',
    description:
      'Rendered @sanity/ui v5 components — nodes carrying a sui- class. Absent on builds that do not ship @sanity/ui v5.',
    read: (census) => (census.ui5Available ? census.nodes.ui5 : null),
  },
  {
    label: 'UI v4 instances',
    unit: 'count',
    track: 'ui5',
    goal: 'lower',
    description:
      'Rendered @sanity/ui v4 components — nodes with a data-ui attribute that are not v5 — the remaining migration backlog on this page.',
    read: (census) => census.nodes.ui4,
  },
  {
    label: 'styled-components instances',
    unit: 'count',
    track: 'styled',
    goal: 'lower',
    description:
      'Rendered nodes styled by styled-components (the test studio widget\u2019s "components" count) — the runtime-styling escape hatch still on the page.',
    read: (census) => census.nodes.styled,
  },
  {
    label: 'styled-components components',
    unit: 'count',
    track: 'styled',
    goal: 'lower',
    description:
      'Distinct styled-components definitions among the rendered nodes (unique component ids) — how many styled() components this page still exercises, regardless of how often each renders.',
    read: (census) => census.styledComponents.components,
  },
  {
    label: 'styled-components CSS rules',
    unit: 'count',
    track: 'styled',
    goal: 'lower',
    description:
      'CSS rules styled-components inserted at runtime — the diagnostics dialog\u2019s "CSS rules inserted by JS".',
    read: (census) => census.styledComponents.cssRules,
  },
  {
    label: 'styled-components CSS bytes',
    unit: 'bytes',
    track: 'styled',
    goal: 'lower',
    description:
      'UTF-8 size of the CSS styled-components inserted at runtime — the diagnostics dialog\u2019s "CSS size inserted by JS". Work the browser does on every page load instead of downloading a static stylesheet.',
    read: (census) => census.styledComponents.cssBytes,
  },
  {
    label: 'styled-components CSS rule share',
    unit: 'percent',
    track: 'styled',
    goal: 'lower',
    description:
      'Share of the page\u2019s readable CSS rules that styled-components inserted (the test studio widget\u2019s "% of CSS rules"). Absent when no stylesheet was readable.',
    read: styledRuleShare,
  },
  {
    label: 'styled-components style tags',
    unit: 'count',
    track: 'styled',
    goal: 'lower',
    description:
      '<style data-styled> elements on the page — one per styled-components runtime. More than one means a plugin bundles its own copy of the library.',
    // Recorded for the run document (a second runtime shows up here, and the
    // diagnostics dialog reports the same number) but not charted: it is 1 on
    // every page, and a flat line of ones tells no migration story.
    charted: false,
    read: (census) => census.styledComponents.styleTags,
  },
  {
    label: 'CSS bytes',
    unit: 'bytes',
    track: 'css',
    goal: 'lower',
    description:
      'UTF-8 size of all the CSS on the page: linked stylesheets, <style> tags (styled-components included) and constructed sheets, measured as the browser serializes the parsed rules — so CSS inserted at runtime and CSS downloaded as a file count the same way. Absent when no stylesheet was readable.',
    read: (census) => (census.css.sheets > 0 ? census.css.bytes : null),
  },
  {
    label: 'CSS rules',
    unit: 'count',
    track: 'css',
    goal: 'lower',
    description:
      'CSS rules on the page across every readable stylesheet, counted inside @layer, @media and other grouping rules (a stylesheet wrapped in one @layer counts its rules, not 1). Absent when no stylesheet was readable.',
    read: (census) => (census.css.sheets > 0 ? census.css.rules : null),
  },
  {
    label: 'style tag CSS bytes',
    unit: 'bytes',
    track: 'css',
    goal: 'lower',
    description:
      'UTF-8 size of the CSS held by <style> elements — styled-components\u2019 sheet and anything else a script inserted — as opposed to linked stylesheets the browser can cache.',
    read: (census) => census.css.styleTags.bytes,
  },
  {
    label: 'style tag CSS rules',
    unit: 'count',
    track: 'css',
    goal: 'lower',
    description:
      'CSS rules held by <style> elements, counted inside grouping rules like the CSS rules row.',
    read: (census) => census.css.styleTags.rules,
  },
]

/** The registry entry behind a bench metric label, or undefined for every other metric. */
export function styleMetricFor(label: string): StyleMetric | undefined {
  return STYLE_METRICS.find((metric) => metric.label === label)
}
