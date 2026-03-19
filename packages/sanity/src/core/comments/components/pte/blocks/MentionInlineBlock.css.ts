import {createVar, style} from '@vanilla-extract/css'

export const fontWeightVar = createVar()
export const hoveredBgVar = createVar()
export const activeBgVar = createVar()

export const mentionSpan = style({
  fontWeight: fontWeightVar,
  color: 'var(--card-link-fg-color)',
  borderRadius: '2px',
  backgroundColor: hoveredBgVar,
  padding: '1px',
  boxSizing: 'border-box',
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: activeBgVar,
    },
  },
})
