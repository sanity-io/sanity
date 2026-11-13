import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join} from 'node:path'

import {buildTheme, getContrastRatio, type ThemeColorCard_v2} from '@sanity/ui/theme'
import {describe, expect, it} from 'vitest'

import {getStudioDefaultTheme} from '../index'
import {UI5_SELECTED_COLORS} from '../ui5SelectedColors'

const ui5Styles = readFileSync(
  join(dirname(createRequire(import.meta.url).resolve('ui5/package.json')), 'dist/styles.css'),
  'utf8',
)

/** The value of a custom property declared in `ui5/styles.css`, in the rule for `selector`. */
function ui5Declaration(selector: string, property: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rule = new RegExp(`(?:^|})${escaped}\\{([^}]*)}`, 'g')
  for (const [, body] of ui5Styles.matchAll(rule)) {
    const value = new RegExp(`(?:^|;)${property}:([^;]+)`).exec(body)
    if (value) return value[1].trim()
  }
  throw new Error(`${selector} does not declare ${property} in ui5/styles.css`)
}

/** `light-dark(var(--blue-600),var(--blue-400))` → `{light: '--blue-600', dark: '--blue-400'}` */
function lightDark(value: string): {light: string; dark: string} {
  const match = /^light-dark\(var\((--[\w-]+)\),\s*var\((--[\w-]+)\)\)$/.exec(value)
  if (!match) throw new Error(`Not a light-dark() pair of variables: ${value}`)
  return {light: match[1], dark: match[2]}
}

const schemes = ['light', 'dark'] as const

describe('UI5_SELECTED_COLORS', () => {
  it('takes each primitive at the hex value ui5/styles.css gives it', () => {
    for (const scheme of schemes) {
      const tokens = UI5_SELECTED_COLORS[scheme]
      for (const color of [
        tokens.background,
        tokens.foreground,
        tokens.muted,
        ...Object.values(tokens.badge),
      ]) {
        expect(ui5Declaration(':root', color.variable)).toBe(color.hex)
      }
    }
  })

  it('uses the primitives the UI 5 semantic tokens resolve to', () => {
    const background = lightDark(ui5Declaration(':root', '--active-background-emphasized'))
    const foreground = lightDark(ui5Declaration(':root', '--active-foreground-emphasized'))
    for (const scheme of schemes) {
      expect(UI5_SELECTED_COLORS[scheme].background.variable).toBe(background[scheme])
      expect(UI5_SELECTED_COLORS[scheme].foreground.variable).toBe(foreground[scheme])
    }

    for (const tone of ['default', 'neutral', 'suggest', 'positive', 'caution', 'critical']) {
      const mark = lightDark(ui5Declaration(`.sui-tone-${tone}`, '--foreground-low-emphasized'))
      for (const scheme of schemes) {
        expect(
          UI5_SELECTED_COLORS[scheme].badge[
            tone as keyof (typeof UI5_SELECTED_COLORS)['light']['badge']
          ].variable,
        ).toBe(mark[scheme])
      }
    }
  })

  it('gives every text 4.5:1 and every mark 3:1 against the selected background', () => {
    for (const scheme of schemes) {
      const {background, foreground, muted, badge} = UI5_SELECTED_COLORS[scheme]
      expect(getContrastRatio(background.hex, foreground.hex)).toBeGreaterThanOrEqual(4.5)
      expect(getContrastRatio(background.hex, muted.hex)).toBeGreaterThanOrEqual(4.5)
      for (const mark of Object.values(badge)) {
        // Badge text uses the same colour as its icon and dot, so it is held to the text ratio.
        expect(getContrastRatio(background.hex, mark.hex)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})

describe('getStudioDefaultTheme', () => {
  const studio = getStudioDefaultTheme().v2!
  const built = buildTheme().v2!

  it('draws the selected state of the blue tones with the UI 5 selected colours', () => {
    for (const scheme of schemes) {
      const {background, foreground, muted, badge} = UI5_SELECTED_COLORS[scheme]
      for (const card of Object.values(studio.color[scheme]) as ThemeColorCard_v2[]) {
        for (const tone of ['default', 'primary'] as const) {
          const selected = card.selectable[tone].selected
          expect(selected.bg).toBe(`var(${background.variable}, ${background.hex})`)
          expect(selected.border).toBe(selected.bg)
          expect(selected.fg).toBe(`var(${foreground.variable}, ${foreground.hex})`)
          expect(selected.muted.fg).toBe(`var(${muted.variable}, ${muted.hex})`)
          expect(selected.icon).toBe(selected.muted.fg)
          expect(selected.badge.positive.icon).toBe(
            `var(${badge.positive.variable}, ${badge.positive.hex})`,
          )
          expect(selected.badge.caution.dot).toBe(
            `var(${badge.caution.variable}, ${badge.caution.hex})`,
          )
        }
      }
    }
  })

  it('leaves every other state, tone and button as @sanity/ui builds them', () => {
    for (const scheme of schemes) {
      for (const [cardTone, card] of Object.entries(studio.color[scheme]) as Array<
        [keyof typeof built.color.light, ThemeColorCard_v2]
      >) {
        const builtCard = built.color[scheme][cardTone]
        expect(card.button).toEqual(builtCard.button)
        for (const [tone, states] of Object.entries(card.selectable)) {
          const builtStates = builtCard.selectable[tone as keyof typeof card.selectable]
          const {selected, ...otherStates} = states
          const {selected: builtSelected, ...builtOtherStates} = builtStates
          expect(otherStates).toEqual(builtOtherStates)
          if (tone !== 'default' && tone !== 'primary') expect(selected).toEqual(builtSelected)
        }
      }
    }
  })

  it('reaches the v0 colour object that legacy components read', () => {
    // oxlint-disable-next-line no-deprecated -- the v0 colour object is what this test checks
    expect(getStudioDefaultTheme().color.light.default.selectable?.default.selected.bg).toBe(
      'var(--blue-600, #4043e7)',
    )
  })
})
