import {css} from '#styled-system/css'

export const statusButton = css({
  'position': 'relative',
  // The children in button is rendered inside a span, we need to absolutely position it.
  '& > span:nth-child(2)': {
    position: 'absolute',
    top: '6px',
    right: '6px',
    padding: 0,
  },
})

export const dot = css({
  width: '4px',
  height: '4px',
  borderRadius: '3px',
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})
