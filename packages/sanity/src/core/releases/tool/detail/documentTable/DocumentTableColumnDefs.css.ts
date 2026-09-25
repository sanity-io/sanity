import {style} from '@vanilla-extract/css'

// Carries its own overflow CSS because @sanity/ui's `textOverflow` prop is inert here.
export const truncatedSpan = style({
  display: 'block',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
