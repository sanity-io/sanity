import {css} from '#styled-system/css'

export const truncatedText = css({
  overflow: 'hidden',
  minInlineSize: 0,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
