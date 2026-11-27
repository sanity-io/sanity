import {css} from '#styled-system/css'

/** The focus lock's element inside the card, laid out as the card's own column */
export const searchCardFocusLock = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  minHeight: 0,
})
