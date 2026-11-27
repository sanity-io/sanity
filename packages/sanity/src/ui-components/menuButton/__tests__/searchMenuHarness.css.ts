import {css} from '#styled-system/css'

/**
 * Caps the harness's menu to the popover and lets its list shrink, as `documentNavigationMenu`
 * does for the document pill menus: the menu and its inner `Stack` become flex columns that can
 * shrink below their content. Three classes beat `Box`'s and `Stack`'s own `display` rules.
 */
export const searchMenu = css({
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
