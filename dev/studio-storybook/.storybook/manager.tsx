import {addons} from 'storybook/manager-api'
import {create} from 'storybook/theming'

// NOTE: the lane logic below is a deliberate MIRROR of lib/lanes.ts (the canonical source
// the preview decorator uses). Storybook builds the manager as a separate bundle that does
// not reliably resolve app-source imports, so the manager cannot `import { resolveLane }`
// from lib/ — an imported resolveLane came through undefined and every row fell back to its
// plain label. Keep the two in sync; both are documented in the org contract §3a.
type Lane = 'uiv3' | 'studio' | 'proposed' | 'envisioned' | 'current' | 'stubbed'

function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function resolveLane(item: {
  id?: string
  tags?: readonly string[]
  exportName?: string
}): Lane | null {
  const tags = item.tags ?? []
  const seg = (
    item.exportName
      ? kebab(item.exportName)
      : (String(item.id ?? '')
          .split('--')
          .pop() ?? '')
  ).split('-')

  // Audit-pair variants win over canon provenance (tag override first, then export name).
  if (tags.includes('variant:none')) return resolveSourceLane(tags, seg)
  if (
    tags.includes('variant:envisioned') ||
    tags.includes('lane:envisioned') ||
    seg.includes('envisioned')
  ) {
    return 'envisioned'
  }
  // Tag-only, no export-name convention — see the note in lib/lanes.ts resolveVariant.
  if (tags.includes('variant:stubbed') || tags.includes('lane:stubbed')) return 'stubbed'
  if (tags.includes('variant:recommended') || seg.includes('recommended')) return 'proposed'
  if (tags.includes('variant:current') || seg.includes('current')) return 'current'
  return resolveSourceLane(tags, seg)
}

function resolveSourceLane(tags: readonly string[], seg: string[]): Lane | null {
  if (tags.includes('source:sanity-ui')) return 'uiv3'
  if (seg.includes('primitive') && tags.includes('source:studio-shadow')) return 'uiv3'
  if (
    tags.includes('source:studio-shadow') ||
    tags.includes('source:studio-only') ||
    tags.includes('source:plugin')
  ) {
    return 'studio'
  }
  return null
}

const INTER =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Liberation Sans", Helvetica, Arial, system-ui, sans-serif'
const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

// Brand lockup: the Sanity monogram (from packages/sanity/static/favicons/favicon.svg,
// stripped of its dark background block so it sits on the dark sidebar) plus a two-line
// wordmark. The monogram path lives in a 512 coord space; the transform fits its
// ~68–442 × 100–410 bbox into a ~30px glyph. The <text> uses a quote-free Inter stack
// (double-quoted family names would close the SVG attribute) and renders in Inter because
// manager-head.html loads it in the manager document.
const BRAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="228" height="34" viewBox="0 0 228 34" fill="none">
<path transform="translate(-5.1 -6) scale(0.0903)" d="M431.519 304.966L417.597 280.733L350.26 321.759L425.051 226.504L436.358 219.867L433.56 215.662L438.697 209.096L415.097 189.445L404.295 203.215L186.253 330.829L266.869 233.849L417.024 151.513L402.758 123.926L320.972 168.755L361.246 120.336L338.174 100L247.535 209.026L157.515 258.413L226.435 167.267L269.621 144.782L255.906 116.888L130.085 182.407L164.396 136.987L140.429 117.785L68 213.678L69.1238 214.576L82.6554 242.139L162.951 200.31L89.7653 297.077L101.76 306.69L108.893 320.484L193.431 274.12L100.338 386.121L123.411 406.457L128.044 400.883L352.623 269.018L278.061 364.014L279.277 365.029L279.162 365.1L294.62 392.002L393.791 331.561L355.604 393.207L381.199 410L442 311.863L431.519 304.966Z" fill="#f1f3f6"/>
<text x="44" y="15" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="700" fill="#f1f3f6" letter-spacing="-0.2">Sanity Studio</text>
<text x="44" y="28.5" font-family="Inter, system-ui, sans-serif" font-size="9.5" font-weight="600" fill="#8b909a" letter-spacing="1.4">COMPONENT CATALOG</text>
</svg>`

const sanityDark = create({
  base: 'dark',
  brandTitle: 'Sanity Studio — Component Catalog',
  brandImage: `data:image/svg+xml,${encodeURIComponent(BRAND_SVG)}`,
  brandTarget: '_self',

  fontBase: INTER,
  fontCode: MONO,

  // Sanity Studio dark neutrals — quiet, so the story canvases stay the focus.
  appBg: '#13141b',
  appContentBg: '#101112',
  appPreviewBg: '#101112',
  appBorderColor: 'rgba(255, 255, 255, 0.10)',
  appBorderRadius: 6,

  barBg: '#13141b',
  barTextColor: '#9ea3ad',
  barHoverColor: '#c7cad0',
  barSelectedColor: '#f1f3f6',

  textColor: '#e3e4e8',
  textMutedColor: '#8b909a',

  inputBg: '#1b1d24',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  inputTextColor: '#e3e4e8',
  inputBorderRadius: 6,

  colorPrimary: '#f03e2f', // Sanity brand red — reserved for accents
  colorSecondary: '#2276fc', // studio blue — selected sidebar item, links, focus
})

// Sidebar lane glyphs: a small coloured mark prefixes each story/docs row with its
// provenance lane (same resolveLane the canvas decorator uses). Glyph + colour mirror the
// canvas markers so the sidebar and the canvas read as one system. Group/root rows carry
// no tags → no glyph. Fully defensive: any surprise in the item shape falls back to the
// plain label so the sidebar can never break.
// Shape per lane. The colours these map to (UI v3 blue, Studio gray, Proposed green,
// Envisioned amber, Current red) live on the canvas markers and the Foundations/Lanes legend.
const GLYPH: Record<Lane, string> = {
  uiv3: '◇', // Lane 1 · UI v3 (raw @sanity/ui primitive)
  studio: '◆', // Lane 2 · Studio (shipped component)
  proposed: '✚', // Lane 3 · Proposed (our audit fix)
  envisioned: '✦', // Lane 4 · Envisioned (future direction)
  current: '●', // Current (as-shipped defect repro)
  // Lane 5 · Stubbed. A hatched square, not a third diamond: ◇ ◆ ◈ are indistinguishable at
  // sidebar size, and hatching is the conventional mark for a placeholder fill.
  stubbed: '▨',
}

interface SidebarItem {
  type?: string
  name?: string
  id?: string
  tags?: readonly string[]
  // Storybook index entries carry this; sidebar items may not.
  exportName?: string
}

// Returns a string, not a React node: Storybook builds the manager as its own bundle where
// JSX / createElement are awkward (JSX threw at render; oxlint forbids createElement), so the
// lane shows as a shape-coded glyph prefixed to the label. The shapes (◇ ◆ ✚ ✦ ●) read
// distinctly on their own; the matching COLOUR is carried by the canvas markers and the
// Foundations/Lanes legend. Fully defensive — any surprise falls back to the plain label.
function renderLabel(item: SidebarItem): string | undefined {
  try {
    if (item.type !== 'story' && item.type !== 'docs') return item.name
    const lane = resolveLane({id: item.id, tags: item.tags, exportName: item.exportName})
    if (!lane) return item.name
    return `${GLYPH[lane]} ${item.name ?? ''}`
  } catch {
    return item.name
  }
}

addons.setConfig({
  theme: sanityDark,
  sidebar: {renderLabel},
})
