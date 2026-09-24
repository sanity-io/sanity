import {css} from '#styled-system/css'

// Carries its own overflow CSS because @sanity/ui's `textOverflow` prop is inert here.
export const truncatedSpan = css({
  display: 'block',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
