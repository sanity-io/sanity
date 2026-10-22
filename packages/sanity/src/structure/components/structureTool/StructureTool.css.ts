import {css} from '#styled-system/css'

export const paneLayout = css({
  // Card (via Box) sets `min-width` and `min-height` on itself
  '&&': {
    minHeight: '100%',
    minWidth: '320px',
  },
})
