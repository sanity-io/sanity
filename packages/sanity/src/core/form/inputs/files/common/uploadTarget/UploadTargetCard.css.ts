import {css} from '#styled-system/css'

export const styledCard = css({
  // `&&`: Card (Box) sets `height` on itself through its `height` prop
  '&&': {
    height: '100%',
  },
})
