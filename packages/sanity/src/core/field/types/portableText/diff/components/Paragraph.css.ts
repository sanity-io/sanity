import {style} from '@vanilla-extract/css'

// This can contain nested <div> elements, so it's not rendered as a <p> element
export const styledParagraph = style({
  textTransform: 'none',
  whiteSpace: 'normal',
  overflowWrap: 'break-word',
  margin: 0,
})
