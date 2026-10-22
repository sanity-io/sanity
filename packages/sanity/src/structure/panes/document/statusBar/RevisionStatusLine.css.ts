import {css} from '#styled-system/css'

export const statusText = css({
  // `&&`: Text sets `color: var(--card-fg-color)` on itself.
  '&&': {
    color: 'var(--card-muted-fg-color)',
  },
  '& em': {
    color: 'var(--card-fg-color)',
    fontWeight: 500,
    fontStyle: 'normal',
  },
})
