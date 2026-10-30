import {css} from '#styled-system/css'

/**
 * Keeps the filter pinned and scrolls the release list once the menu is full.
 *
 * `Menu` is a `Box`: `display: block` is `&:not([hidden])` (0,2,0) and
 * `overflow: auto` is one class. Three classes beat both.
 *
 * The inner `Stack` sets `display: grid` with `&&:not([hidden])` (0,3,0) and
 * `grid-gap` from its gap. Three classes on this menu plus `[data-ui="Stack"]`
 * beat both, so the stack stays a gapless column.
 */
export const globalPerspectiveMenu = css({
  'minWidth': '280px',
  'maxWidth': '360px',
  '&&&': {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  '&&& > [data-ui="Stack"]': {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    overflow: 'hidden',
  },
})

export const releasesMenuItemIcon = css({
  '&&:not([hidden])': {
    display: 'inline',
  },
})
