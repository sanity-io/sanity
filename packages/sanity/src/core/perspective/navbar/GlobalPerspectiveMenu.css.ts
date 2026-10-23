import {css} from '#styled-system/css'

export const styledMenu = css({
  'maxWidth': '320px',
  // `&&` beats Box's own `min-width: 0` (Menu renders a Box)
  '&&': {
    minWidth: '200px',
  },
  /* Remove the default menu gap */
  "& > [data-ui='Stack']": {
    gap: 0,
  },
})
