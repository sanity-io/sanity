import {Card} from '@sanity/ui'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {styled} from 'styled-components'

import {inventoryContainerName} from '../CreateVariant/CreateVariant.css'

/**
 * The width of the selection checkbox, the size of a `@sanity/ui` checkbox.
 *
 * @internal
 */
export const CHECKBOX_COLUMN_WIDTH = 17

/**
 * The shared leading column for group icons (the Published and Draft dots, a release bolt or clock)
 * and row marks (the variant diamond). The same 21px as the navbar menus' leading column, so icons
 * and marks line up down the panel.
 *
 * @internal
 */
export const LEADING_COLUMN_WIDTH = 21

/**
 * One grid for a set's header and its rows, which are subgrids of it: the row padding, the
 * checkbox, a gap, the icon and mark column, a gap, then the text. Every header and row text starts
 * at the same x. A set whose versions can never be selected, as in the picker, has no checkbox
 * column.
 *
 * The padding and the gaps are tracks rather than the rows' own padding and a column gap: a subgrid's
 * padding would eat into its edge tracks, and a column gap would also open between the padding and
 * the checkbox.
 */
export const VariantSet = styled(Card)(({theme}) => {
  const {color, space} = getThemeV2(theme)

  return `
  --inventory-row-padding: ${space[3]}px;
  --inventory-leading-gap: ${space[2]}px;

  display: grid !important;
  grid-template-columns:
    [row-start] var(--inventory-row-padding)
    [check-start] ${CHECKBOX_COLUMN_WIDTH}px
    [check-end] var(--inventory-leading-gap)
    [mark-start] ${LEADING_COLUMN_WIDTH}px
    [mark-end] var(--inventory-leading-gap)
    [text-start] minmax(0, 1fr)
    [text-end] var(--inventory-row-padding)
    [row-end];

  &[data-selectable='false'] {
    grid-template-columns:
      [row-start] var(--inventory-row-padding)
      [mark-start] ${LEADING_COLUMN_WIDTH}px
      [mark-end] var(--inventory-leading-gap)
      [text-start] minmax(0, 1fr)
      [text-end] var(--inventory-row-padding)
      [row-end];
  }

  /*
   * Below this the row's own padding would leave the text column less than its 140px, so the row
   * gives up some of its padding before the text gives up any width.
   */
  @container ${inventoryContainerName} (width < 240px) {
    --inventory-row-padding: ${space[2]}px;
  }

  * + & {
    border-block-start: 1px solid ${color.border};
  }
`
})
