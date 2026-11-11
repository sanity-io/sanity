import {css} from '#styled-system/css'

export const content = css({
  'opacity': 0,
  'transition': 'opacity 200ms',
  '&[data-mounted]': {
    opacity: 1,
  },
})
