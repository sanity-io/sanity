import {style} from '@vanilla-extract/css'

export const dividerDiv = style({
  borderRight: '1px solid var(--card-border-color)',
  height: 'auto',
  selectors: {
    '&[data-hidden]': {
      opacity: 0,
    },
  },
})
