import {style} from '@vanilla-extract/css'

export const rootBox = style({
  selectors: {
    '&&': {
      overflow: 'auto',
      maxHeight: '75vh',
    },
  },
})

export const dialogHeader = style({
  position: 'sticky',
  display: 'grid',
  gridTemplateColumns: '64px 1fr 64px',
  top: 0,
  zIndex: 1,
  background: 'var(--card-bg-color)',
})

export const floatingButtonBox = style({
  position: 'absolute',
  top: '12px',
  right: '24px',
  zIndex: 2,
})
