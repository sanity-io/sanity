import {css} from '#styled-system/css'

export const menu = css({
  'maxWidth': '300px',
  // `&&` beats Box's own `min-width: 0` (Menu renders a Box)
  '&&': {
    minWidth: '200px',
  },
})
