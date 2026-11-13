import {Card} from '@sanity/ui'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {styled} from 'styled-components'

import {inventoryContainerName} from '../CreateVariant/CreateVariant.css'

/**
 * The width of the selection checkbox, the size of a `@sanity/ui` checkbox.
 *
 * @internal
 */
const CHECKBOX_COLUMN_WIDTH = 17

/**
 * The status mark column at the row's right edge, for group marks (the Published disc, the Draft
 * ring, a release bolt or clock) and row marks (the variant diamond) alike, so they line up down the
 * panel. The 21px slot of the navbar menus' icon column.
 *
 * @internal
 */
export const MARK_COLUMN_WIDTH = 21

/**
 * One grid for a set's header and its rows, which are subgrids of it: the row padding, the
 * checkbox gutter, a gap, the text, a gap, the mark column, then the row padding. Every header and
 * row text starts right after the checkbox gutter, at the same x, and every mark sits in the same
 * trailing column. The checkbox gutter is always there, so rows never move when the checkboxes
 * show. A set whose versions can never be selected, as in the picker, has no gutter.
 *
 * The padding and the gaps are tracks rather than the rows' own padding and a column gap: a subgrid's
 * padding would eat into its edge tracks, and a column gap would also open between the padding and
 * the checkbox.
 */
export const VariantSet = styled(Card)(({theme}) => {
  const {color, space} = getThemeV2(theme)

  return `
  --inventory-row-padding: ${space[3]}px;
  --inventory-column-gap: ${space[2]}px;

  display: grid !important;
  grid-template-columns:
    [row-start] var(--inventory-row-padding)
    [check-start] ${CHECKBOX_COLUMN_WIDTH}px
    [check-end] var(--inventory-column-gap)
    [text-start] minmax(0, 1fr)
    [text-end] var(--inventory-column-gap)
    [mark-start] ${MARK_COLUMN_WIDTH}px
    [mark-end] var(--inventory-row-padding)
    [row-end];

  &[data-selectable='false'] {
    grid-template-columns:
      [row-start] var(--inventory-row-padding)
      [text-start] minmax(0, 1fr)
      [text-end] var(--inventory-column-gap)
      [mark-start] ${MARK_COLUMN_WIDTH}px
      [mark-end] var(--inventory-row-padding)
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

/**
 * A group's rows, as one element so the header's toggle can point at them (aria-controls)
 * and hide them. It takes no box of its own, so the rows stay subgrids of the set.
 *
 * @internal
 */
export const VariantSetRows = styled.div`
  display: contents;

  &[hidden] {
    display: none;
  }
`
