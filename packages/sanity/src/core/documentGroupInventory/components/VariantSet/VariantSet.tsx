import {Card} from '@sanity/ui'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {styled} from 'styled-components'

import {inventoryContainerName} from '../CreateVariant/CreateVariant.css'
import {SELECTION} from './selectionTokens'

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
 * The presence column, just before the mark column, for the avatars of the people who have a
 * version open. It is as wide as the most it holds: two size 0 avatars, or the count of the rest
 * and one avatar. It is reserved on every row, so a row does not move when someone opens it.
 *
 * @internal
 */
export const PRESENCE_COLUMN_WIDTH = 40

/**
 * One grid for a set's header and its rows, which are subgrids of it: the row padding, the
 * checkbox gutter, a gap, the text, a gap, the presence column, the mark column, then the row
 * padding. The header's text also takes the presence column, since a header has no avatars. Every header and
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

  /*
   * A Draft set that exists only for the ghost row of a draft not created yet: one dashed outline
   * around its header and the ghost row together, drawn over them (the sticky header would paint
   * over an outline on the set itself). The header and row drop their own outlines inside it.
   */
  &[data-ghost-set] {
    position: relative;
  }

  &[data-ghost-set]::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    border: 1px dashed ${SELECTION.openBackground};
    pointer-events: none;
  }
  grid-template-columns:
    [row-start] var(--inventory-row-padding)
    [check-start] ${CHECKBOX_COLUMN_WIDTH}px
    [check-end] var(--inventory-column-gap)
    [text-start] minmax(0, 1fr)
    [text-end] var(--inventory-column-gap)
    [presence-start] ${PRESENCE_COLUMN_WIDTH}px
    [presence-end mark-start] ${MARK_COLUMN_WIDTH}px
    [mark-end] var(--inventory-row-padding)
    [row-end];

  &[data-selectable='false'] {
    grid-template-columns:
      [row-start] var(--inventory-row-padding)
      [text-start] minmax(0, 1fr)
      [text-end] var(--inventory-column-gap)
      [presence-start] ${PRESENCE_COLUMN_WIDTH}px
      [presence-end mark-start] ${MARK_COLUMN_WIDTH}px
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
