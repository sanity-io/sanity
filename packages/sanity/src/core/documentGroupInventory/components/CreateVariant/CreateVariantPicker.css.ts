import {css} from '#styled-system/css'

/**
 * Note: this UI is based on other instances of filterable menus in the
 * codebase. This UI is likely to be refactored shortly, so it's not worth
 * establishing a new abstraction.
 */
export const createVariantPickerMenu = css({
  '&&&': {
    minWidth: 'min(280px, calc(100vw - 24px))',
    maxWidth: 'min(360px, calc(100vw - 24px))',
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
