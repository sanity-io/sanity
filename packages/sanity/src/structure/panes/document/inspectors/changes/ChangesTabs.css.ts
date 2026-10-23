import {css} from '#styled-system/css'

export const fadeInFlex = css({
  'opacity': 0,
  'transition': 'opacity 200ms',

  '&[data-ready]': {
    opacity: 1,
  },
})
