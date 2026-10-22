import {css} from '#styled-system/css'

export const transparentCard = css({
  // `&&` beats Card's own `background-color: var(--card-bg-color)`
  '&&': {
    background: 'none',
  },
})
