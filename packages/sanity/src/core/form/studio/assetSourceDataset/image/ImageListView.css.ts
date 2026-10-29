import {css} from '#styled-system/css'

export const thumbGrid = css({
  // `&&`: Grid sets `grid-template-columns` on itself (`columns` prop)
  '&&': {
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  },
})
