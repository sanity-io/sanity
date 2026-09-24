import {css} from '#styled-system/css'

export const column = css({
  '&:not(:last-child)': {
    borderRight: '1px solid var(--card-border-color)',
  },
})
