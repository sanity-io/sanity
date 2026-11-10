import {css} from '#styled-system/css'

export const flipIcon = css({
  'transition': 'transform 200ms',

  "&[data-expanded='true']": {
    transform: 'rotate(-90deg)',
  },
})
