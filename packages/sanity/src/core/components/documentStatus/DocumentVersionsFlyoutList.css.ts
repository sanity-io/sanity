import {css} from '#styled-system/css'

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  // The menu inset: 8px on every side, between the panel's edge and the rows
  padding: '8px',
  width: '400px',
  maxWidth: '100vw',
  boxSizing: 'border-box',
})
