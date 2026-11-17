import {css} from '#styled-system/css'

// This can contain nested <div> elements, so it's not rendered as a <p> element
export const styledParagraph = css({
  textTransform: 'none',
  whiteSpace: 'wrap',
  overflowWrap: 'break-word',
  margin: '0',
})
