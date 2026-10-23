import {css} from '#styled-system/css'

export const sortIcon = css({
  '&[data-direction="desc"]': {
    rotate: '180deg',
  },
  '@media (prefers-reduced-motion: no-preference)': {
    transition: 'rotate 0.25s ease-in-out',
  },
})
