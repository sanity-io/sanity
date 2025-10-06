import {style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

export const dividerStyle = style({
  borderRight: `1px solid ${vars.color.border}`,
  height: 'auto',
  selectors: {
    '&[data-hidden]': {
      opacity: 0,
    },
  },
})
