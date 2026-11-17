import {css} from '#styled-system/css'

export const styledButton = css({
  // Button sets `padding: 0` on its root; `&&` beats it regardless of sheet order.
  '&&': {
    padding: '3px 6px',
  },
})
