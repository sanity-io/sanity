import {style} from '@vanilla-extract/css'

export const dividerContainer = style({
  alignItems: 'center',
  gap: '1rem',
  margin: '0.75rem 0 0.25rem 0',
  selectors: {
    // ui5 Box sets `.sui-display-block:not([hidden]) {display: block}` (0,2,0)
    '&&&': {
      display: 'flex',
    },
  },
})

export const divider = style({
  flex: 1,
  backgroundColor: 'var(--card-border-color)',
  height: '1px',
  margin: 0,
  border: 'none',
})

export const dividerTitle = style({
  paddingBottom: '0.75rem',
  paddingLeft: '0.5rem',
  paddingRight: '0.5rem',
})
