import {style} from '@vanilla-extract/css'

export const dividerContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  margin: '0.75rem 0 0.25rem 0',
})

export const divider = style({
  flex: 1,
  backgroundColor: 'var(--card-border-color)',
  height: '1px',
  margin: '0',
  border: 'none',
})

export const dividerTitle = style({
  selectors: {
    '&&': {
      paddingBottom: '0.75rem',
      paddingLeft: '0.5rem',
      paddingRight: '0.5rem',
    },
  },
})
