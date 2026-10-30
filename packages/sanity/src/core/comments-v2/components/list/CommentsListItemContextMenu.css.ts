import {css} from '#styled-system/css'

export const floatingCard = css({
  // `&&` beats Card's own `&:not([hidden]) {display: flex}` (0,2,0) from the `display` prop
  '&&:empty': {
    display: 'none',
  },
})
