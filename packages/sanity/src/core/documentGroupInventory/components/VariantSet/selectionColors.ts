import {type getTheme_v2 as getThemeV2} from '@sanity/ui/theme'

import {mixColors} from '../../utils/contrast'

type ThemeColor = ReturnType<typeof getThemeV2>['color']

/** How much of the selection colour tints a checked row. */
const SELECTED_ROW_TINT = 0.16

/**
 * How much of the selection colour tints a checked group header, over its own band. More than a
 * row's, so a header stays one step stronger than the rows under it when the whole group is checked.
 */
const SELECTED_HEADER_TINT = 0.26

/**
 * The colours of the checked state, mixed from the theme's own colours so they hold in light and
 * dark: the row tint and the header's.
 *
 * @internal
 */
export function selectionColors(color: ThemeColor) {
  const row = mixColors(color.focusRing, color.bg, SELECTED_ROW_TINT)
  const header = mixColors(color.focusRing, color.muted.bg, SELECTED_HEADER_TINT)

  return {row, header}
}
