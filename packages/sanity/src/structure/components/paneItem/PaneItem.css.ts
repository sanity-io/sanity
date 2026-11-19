import {css} from '#styled-system/css'

/**
 * The chevron of a list item that opens a child pane. Faded on its own, at full strength when its
 * row is selected; its colour on the selected row is set on the icon itself (see `PaneItem`).
 */
export const paneItemChevron = css({
  'opacity': 0.5,
  '[data-selected] &': {
    opacity: 1,
  },
})
