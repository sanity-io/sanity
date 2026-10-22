import {css} from '#styled-system/css'

export const statusText = css({
  // Text sets `& strong {font-weight}` itself, also at (0,1,1); the runtime-injected wrapper used to
  // win that tie by insertion order, so the class is doubled to (0,2,1).
  '&& strong': {
    fontWeight: 500,
    color: 'var(--card-fg-color)',
  },
  '& time': {
    whiteSpace: 'nowrap',
  },
})
