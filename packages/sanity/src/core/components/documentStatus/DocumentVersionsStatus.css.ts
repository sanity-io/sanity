import {css} from '#styled-system/css'

export const root = css({
  maxWidth: '440px',
  minWidth: '400px',
  width: 'max-content',
})

export const line = css({
  'minHeight': '33px',
  '& + &': {
    borderTop: '1px solid var(--card-border-color)',
    minHeight: '34px',
  },
})

export const lineName = css({
  flex: '1 1 auto',
  minWidth: '96px',
})

export const lineIcons = css({
  display: 'flex',
  flex: 'none',
  gap: '2px',
})
