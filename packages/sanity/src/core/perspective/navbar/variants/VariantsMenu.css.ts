import {css} from '#styled-system/css'

/**
 * Caps the menu to the popover height and scrolls the list section. `Menu`'s
 * own `overflow: auto` would scroll the whole popover.
 *
 * `display` and `overflow` use three classes so they beat `Box`'s
 * `&:not([hidden]) { display: block }` and the menu's `overflow: auto` class.
 * The inner `Stack` rule uses the same three classes plus `[data-ui="Stack"]`
 * so it beats `Stack`'s `&&:not([hidden]) { display: grid }` and its `grid-gap`.
 */
export const variantsMenu = css({
  'minWidth': '280px',
  'maxWidth': '360px',
  '&&&': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
    overflow: 'hidden',
  },
  '&&& > [data-ui="Stack"]': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    gap: 0,
    overflow: 'hidden',
  },
})
