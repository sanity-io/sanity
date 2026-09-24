import {css} from '#styled-system/css'

export const root = css({
  'bottom': 0,
  // Layer sets `position: relative` on itself
  '&&': {
    position: 'sticky',
  },
})

export const rootCard = css({
  // Card (via Box) sets `padding` on itself
  '&&': {
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
})
