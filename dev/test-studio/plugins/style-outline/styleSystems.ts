export type StyleSystemId = 'ui5' | 'ui4' | 'styled'

export interface StyleSystem {
  id: StyleSystemId
  label: string
  color: string
  selector: string
}

interface Fingerprint extends Omit<StyleSystem, 'selector'> {
  match: string
}

// Ordered by precedence: a node belongs to the first fingerprint it matches, so a
// `styled(ui5Box)` counts as ui5 and a `styled(ui4Card)` counts as ui4.
const FINGERPRINTS: readonly Fingerprint[] = [
  {id: 'ui5', label: 'ui5', color: '#22d3ee', match: '[class^="sui-"], [class*=" sui-"]'},
  {id: 'ui4', label: '@sanity/ui v4', color: '#f5a524', match: '[data-ui]'},
  {
    id: 'styled',
    label: 'styled-components',
    color: '#ff4fa3',
    // Prebuilt studio bundles emit `<Name>-sc-<hash>` ids; `sanity dev` resolves the studio from
    // source without the styled-components transform, so ids are bare `sc-<hash>` tokens.
    match: '[class*="-sc-"], [class^="sc-"], [class*=" sc-"]',
  },
]

export const STYLE_SYSTEMS: readonly StyleSystem[] = FINGERPRINTS.map(
  ({match, ...system}, index) => {
    const preceding = FINGERPRINTS.slice(0, index).map((other) => other.match)
    const exclusions = preceding.length > 0 ? `:not(${preceding.join(', ')})` : ''
    return {...system, selector: `:is(${match})${exclusions}`}
  },
)

export const STYLE_OUTLINE_ATTRIBUTE = 'data-style-outline'
export const STYLE_OUTLINE_STORAGE_KEY = 'sanity-test-studio:style-outline'
