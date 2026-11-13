import {type getTheme_v2 as getThemeV2} from '@sanity/ui/theme'

import {ensureContrast, mixColors} from '../../utils/contrast'

type ThemeColor = ReturnType<typeof getThemeV2>['color']

/** How much of the selection colour tints a checked row. */
const SELECTED_ROW_TINT = 0.16

/**
 * How much of the selection colour tints a checked group header, over its own band. More than a
 * row's, so a header stays one step stronger than the rows under it when the whole group is checked.
 */
const SELECTED_HEADER_TINT = 0.26

/** The badge tones a row can show. */
export type SelectionBadgeTone = 'primary' | 'positive' | 'suggest'

/**
 * The colours of the checked state, mixed from the theme's own colours so they hold in light and
 * dark: the row and header tints, and the outline a badge switches to on a checked row.
 *
 * @internal
 */
export function selectionColors(color: ThemeColor) {
  const row = mixColors(color.focusRing, color.bg, SELECTED_ROW_TINT)
  const header = mixColors(color.focusRing, color.muted.bg, SELECTED_HEADER_TINT)

  return {
    row,
    header,
    /**
     * A badge's text and outline on a checked row: its tone's text colour, moved toward the theme's
     * text colour only as far as it needs to reach 4.5:1 on the tint (which also clears the 3:1 an
     * outline needs).
     */
    badge: (tone: SelectionBadgeTone) => ensureContrast(color.badge[tone].fg, row, color.fg, 4.5),
  }
}
