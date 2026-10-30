import {type Theme_v2} from '@sanity/ui/theme'
import {type CSSProperties} from 'react'

/**
 * What the perspective chip's height is read from. `font` and `space` size a
 * default button; `card` is the border that sits outside the controls.
 */
type PerspectiveChipTheme = Pick<Theme_v2, 'card' | 'font' | 'space'>

/**
 * Border-box height of a default `@sanity/ui` button, in pixels.
 *
 * The button defaults to text size 1 and `padding={3}`: the cap height of that
 * text size (`lineHeight - ascenderHeight - descenderHeight`) plus `space[3]`
 * above and below. The built-in theme is 9 + 12 + 12 = 33. A button paints its
 * outline as an inset shadow, so the border is not part of this height.
 *
 * Studio navbar buttons are shorter. They go through the studio `Button`, which
 * passes `padding={2}`, and that lays out at cap height plus `space[2]` twice
 * (25px on the built-in theme). The chip matches the default button, not those.
 */
export function perspectiveChipHeight(theme: PerspectiveChipTheme): number {
  const text = theme.font.text.sizes[1]
  const padding = theme.space[3]
  if (text === undefined || padding === undefined) {
    throw new Error('perspective chip height needs text size 1 and space[3]')
  }
  const capHeight = text.lineHeight - text.ascenderHeight - text.descenderHeight
  return capHeight + padding + padding
}

/**
 * Height of the controls inside the chip, in pixels.
 *
 * The chip is a card with a real border (`card.border.width`, 1px on the
 * built-in theme) around controls that fill its content box. The card's border
 * box is `perspectiveChipHeight` (33px), so the controls are that height minus
 * a border on each side (31px). The loading skeleton uses the same value, and
 * its own 1px border then brings the row back to the chip's height.
 */
export function perspectiveControlHeight(theme: PerspectiveChipTheme): number {
  return perspectiveChipHeight(theme) - theme.card.border.width * 2
}

interface PerspectiveControlStyle extends CSSProperties {
  '--perspective-control-height': string
}

/** Sets `--perspective-control-height` for the chip's controls and its skeleton. */
export function perspectiveControlStyle(theme: PerspectiveChipTheme): PerspectiveControlStyle {
  return {'--perspective-control-height': `${perspectiveControlHeight(theme)}px`}
}
