import {css} from '#styled-system/css'

export const pathSegment = css({
  '&:not(:last-child)::after': {
    content: "' ➝ '",
    opacity: 0.5,
  },
})
