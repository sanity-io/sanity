import {css} from '#styled-system/css'

export const statusText = css({
  // `&&`: Text sets `color` on itself at (0,1,0).
  '&&': {
    color: 'var(--card-muted-fg-color)',
  },
  '& em': {
    color: 'var(--card-fg-color)',
    fontWeight: 500,
    fontStyle: 'normal',
  },
})
