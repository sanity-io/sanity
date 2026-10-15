import {style} from '@vanilla-extract/css'

export const truncatedText = style({
  overflow: 'hidden',
  minInlineSize: 0,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
