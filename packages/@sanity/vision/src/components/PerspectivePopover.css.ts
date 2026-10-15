import {css} from '#styled-system/css'

export const perspectivePopoverContent = css({
  /* This limits the width of the popover content */
  maxWidth: '240px',
})

export const perspectivePopoverLink = css({
  cursor: 'pointer',
  marginRight: 'auto',
})

export const dot = css({
  width: '4px',
  height: '4px',
  borderRadius: '3px',
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})
