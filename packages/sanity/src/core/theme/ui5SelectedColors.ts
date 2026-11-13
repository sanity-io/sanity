import {
  type RootTheme,
  type ThemeColorBadge_v2,
  type ThemeColorCard_v2,
  type ThemeColorState_v2,
} from '@sanity/ui/theme'

type Scheme = 'light' | 'dark'

/**
 * A `@sanity/ui` 5 colour primitive and the hex value it has in `ui5/styles.css`. The hex is the
 * fallback for a page that has not loaded that stylesheet, and the value the contrast test measures.
 */
interface Ui5Color {
  variable: `--${string}`
  hex: string
}

/** Renders a token as `var(--blue-600, #4043e7)`. */
function cssVar(color: Ui5Color): string {
  return `var(${color.variable}, ${color.hex})`
}

/**
 * The tones a status mark or badge can carry. `default`, `neutral` and `primary` are the tones whose
 * mark sits on the selected blue without a hue of its own; the rest keep their hue.
 */
type BadgeTone = 'default' | 'neutral' | 'primary' | 'suggest' | 'positive' | 'caution' | 'critical'

interface SelectedColorTokens {
  /** `--active-background-emphasized` */
  background: Ui5Color
  /** `--active-foreground-emphasized` */
  foreground: Ui5Color
  /** Secondary text and icons: the blue one step from the end of the scale. */
  muted: Ui5Color
  /** Each tone's `--foreground-low-emphasized`, so a mark keeps its own hue on the blue. */
  badge: Record<BadgeTone, Ui5Color>
}

/**
 * The UI 5 selected colours, per scheme.
 *
 * Each value is the primitive that the named UI 5 semantic token resolves to in that scheme
 * (`light-dark(light, dark)` in `ui5/styles.css`). The theme already has one object per scheme, so
 * it takes the primitive for its own scheme instead of the semantic token: `light-dark()` is
 * resolved from the `color-scheme` at the element, and a consumer's bundler that down-levels it
 * gates the result on `prefers-color-scheme` instead, which a dark card inside a light studio does
 * not match. `ui5SelectedColors.test.ts` checks that every primitive still matches its semantic token.
 *
 * @internal
 */
export const UI5_SELECTED_COLORS: Record<Scheme, SelectedColorTokens> = {
  light: {
    background: {variable: '--blue-600', hex: '#4043e7'},
    foreground: {variable: '--white', hex: '#fff'},
    muted: {variable: '--blue-100', hex: '#e5edff'},
    badge: {
      default: {variable: '--gray-100', hex: '#eeeef1'},
      neutral: {variable: '--gray-100', hex: '#eeeef1'},
      primary: {variable: '--blue-100', hex: '#e5edff'},
      suggest: {variable: '--purple-100', hex: '#f1ebff'},
      positive: {variable: '--green-100', hex: '#c5fce8'},
      caution: {variable: '--yellow-100', hex: '#fcf3bb'},
      critical: {variable: '--red-100', hex: '#ffe7e5'},
    },
  },
  dark: {
    background: {variable: '--blue-400', hex: '#7595ff'},
    foreground: {variable: '--black', hex: '#13141b'},
    muted: {variable: '--blue-900', hex: '#161a41'},
    badge: {
      default: {variable: '--gray-900', hex: '#1b1d27'},
      neutral: {variable: '--gray-900', hex: '#1b1d27'},
      primary: {variable: '--blue-900', hex: '#161a41'},
      suggest: {variable: '--purple-900', hex: '#23173f'},
      positive: {variable: '--green-900', hex: '#06231a'},
      caution: {variable: '--yellow-900', hex: '#271a11'},
      critical: {variable: '--red-900', hex: '#321615'},
    },
  },
}

/**
 * The selectable tones that draw the selected item in blue. The other tones (`neutral`,
 * `positive`, `caution`, `critical`, `suggest`) have selected states of their own hue and keep them.
 */
const BLUE_SELECTABLE_TONES = ['default', 'primary'] as const

function selectedState(state: ThemeColorState_v2, tokens: SelectedColorTokens): ThemeColorState_v2 {
  const bg = cssVar(tokens.background)
  const muted = cssVar(tokens.muted)
  const badge = Object.fromEntries(
    Object.entries(state.badge).map(([tone, value]) => {
      const mark = cssVar(tokens.badge[tone as BadgeTone] ?? tokens.badge.default)
      return [tone, {...value, bg, dot: mark, fg: mark, icon: mark}]
    }),
  ) as ThemeColorBadge_v2

  return {
    ...state,
    bg,
    border: bg,
    fg: cssVar(tokens.foreground),
    icon: muted,
    muted: {...state.muted, fg: muted},
    badge,
  }
}

/**
 * Gives the selected state of the blue selectable tones the UI 5 selected colours, in every card
 * tone and both schemes. Hover, pressed, focus, disabled and the buttons are left as built.
 *
 * Mutates `theme`, which must be a theme built for Studio and not shared: the `@sanity/ui` 4 v0
 * colour object is derived lazily from `theme.v2`, so a change made before first use reaches both.
 *
 * @internal
 */
export function applyUi5SelectedColors(theme: RootTheme): RootTheme {
  const {v2} = theme
  if (!v2) return theme

  for (const scheme of ['light', 'dark'] as const) {
    const tokens = UI5_SELECTED_COLORS[scheme]
    const cardTones = v2.color[scheme] as Record<string, ThemeColorCard_v2>
    for (const card of Object.values(cardTones)) {
      for (const tone of BLUE_SELECTABLE_TONES) {
        const states = card.selectable[tone]
        if (states) {
          card.selectable[tone] = {...states, selected: selectedState(states.selected, tokens)}
        }
      }
    }
  }
  return theme
}
