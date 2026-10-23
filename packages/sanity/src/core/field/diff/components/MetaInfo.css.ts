import {css} from '#styled-system/css'

export const metaText = css({
  // `&&`: Text sets `color` on itself at (0,1,0); double the class so `inherit` wins regardless
  // of stylesheet order.
  '&&': {
    color: 'inherit',
  },
})
