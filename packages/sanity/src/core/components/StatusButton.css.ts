import {style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

export const styledButton = style({
  position: 'relative',
  // The children in button is rendered inside a span, we need to absolutely position it.
  selectors: {
    '& > span:nth-child(2)': {
      position: 'absolute',
      top: '6px',
      right: '6px',
      padding: 0,
    },
  },
})

export const dot = style({
  width: '4px',
  height: '4px',
  borderRadius: '3px',
  boxShadow: `0 0 0 1px ${vars.color.bg}`,
})
