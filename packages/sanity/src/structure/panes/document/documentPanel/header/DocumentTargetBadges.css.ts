import {css} from '#styled-system/css'

export const badgeWrapper = css({
  'flex': 'none',
  '&[data-target-missing]': {opacity: 0.5},
  '@media (prefers-reduced-motion: no-preference)': {
    transition: 'opacity 0.2s ease-out',
  },
})
