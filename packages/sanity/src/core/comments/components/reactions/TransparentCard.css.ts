import {css} from '#styled-system/css'

export const transparentCard = css({
  // Card sets background-color on itself
  '&&': {
    background: 'none',
  },
})
