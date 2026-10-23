import {css} from '#styled-system/css'

export const customGrid = css({
  '&&': {
    gridTemplateColumns: 'repeat(7, minmax(44px, auto))',
  },
})
