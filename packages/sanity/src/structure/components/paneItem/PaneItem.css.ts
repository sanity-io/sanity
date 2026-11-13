import {css} from '#styled-system/css'

/**
 * The chevron of a list item that opens a child pane. Faded on its own, it follows the selected
 * card's secondary text colour when its row is selected: `ui5`'s `Icon` keeps a static colour, which
 * has no contrast with the selected background.
 */
export const paneItemChevron = css({
  'opacity': 0.5,
  '[data-selected] &': {
    'opacity': 1,
    '& > *': {
      color: 'var(--card-muted-fg-color)',
    },
  },
})
