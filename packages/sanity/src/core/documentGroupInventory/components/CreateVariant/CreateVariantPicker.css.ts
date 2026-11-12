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

/**
 * PROPOSED: the select of the inset form is the size of a Studio string input: 35px high, 15px text (the input measures 35px, 15px, 6px 12px).
 */
export const createVariantPickerInsetTrigger = css({
  '& button': {
    blockSize: '35px',
    minBlockSize: '35px',
  },
  '& button [data-ui="Text"]': {
    fontSize: '15px',
    lineHeight: '19px',
  },
})
