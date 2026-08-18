import {style} from '@vanilla-extract/css'

export const perspectivePopoverContent = style({
  /* This limits the width of the popover content */
  maxWidth: '240px',
})

export const perspectivePopoverLink = style({
  cursor: 'pointer',
  marginRight: 'auto',
})

export const dot = style({
  width: '4px',
  height: '4px',
  borderRadius: '3px',
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})
