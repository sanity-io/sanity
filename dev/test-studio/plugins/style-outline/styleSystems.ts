export type StyleSystemId = 'ui5' | 'ui4' | 'styled'

export interface StyleSystem {
  id: StyleSystemId
  label: string
  color: string
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

export const STYLE_OUTLINE_ATTRIBUTE = 'data-style-outline'
export const STYLE_OUTLINE_STORAGE_KEY = 'sanity-test-studio:style-outline'
