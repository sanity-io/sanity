import {buildTheme} from '@sanity/ui/theme'
import {describe, expect, test} from 'vitest'

import {
  perspectiveChipHeight,
  perspectiveControlHeight,
  perspectiveControlStyle,
} from './perspectiveChipHeight'

describe('perspectiveChipHeight', () => {
  test('matches a default button, with the card border outside the controls', () => {
    const theme = buildTheme().v2
    if (!theme) throw new Error('expected a v2 theme')

    const text = theme.font.text.sizes[1]
    if (!text) throw new Error('expected text size 1')
    const capHeight = text.lineHeight - text.ascenderHeight - text.descenderHeight
    const padding = theme.space[3]
    if (padding === undefined) throw new Error('expected space[3]')

    // Built-in theme: cap height 9, space[3] 12, border 1. 33px chip, 31px controls.
    expect(perspectiveChipHeight(theme)).toBe(capHeight + padding + padding)
    expect(perspectiveChipHeight(theme)).toBe(33)
    expect(perspectiveControlHeight(theme)).toBe(
      perspectiveChipHeight(theme) - theme.card.border.width * 2,
    )
    expect(perspectiveControlHeight(theme)).toBe(31)
    expect(perspectiveControlStyle(theme)).toEqual({'--perspective-control-height': '31px'})
  })
})
