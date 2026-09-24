import {css} from '#styled-system/css'

export const root = css({
  overflow: 'auto',
  maxHeight: '75vh',
})

export const dialogHeader = css({
  position: 'sticky',
  display: 'grid',
  gridTemplateColumns: '64px 1fr 64px',
  top: 0,
  zIndex: 1,
  background: 'var(--card-bg-color)',
})

export const floatingButtonBox = css({
  position: 'absolute',
  top: '12px',
  right: '24px',
  zIndex: 2,
})
