import {css, firstThatWorks} from '#styled-system/css'

export const cardWrapper = css({
  // `&&`: Card (Box) sets `box-sizing` on itself through its `sizing` prop
  '&&': {
    boxSizing: 'border-box',
  },
})

export const flexWrapper = css({
  'textOverflow': 'ellipsis',
  // `&&`: Flex (Box) sets `box-sizing` and `overflow` on itself through its props
  '&&': {
    boxSizing: 'border-box',
    overflow: firstThatWorks('clip', 'hidden'),
  },
})

export const leftSection = css({
  position: 'relative',
  width: '60%',
})

export const codeWrapper = css({
  'width': '100%',
  // `&&`: Code sets `position: relative` on itself
  '&&': {
    position: 'relative',
  },
  '& code': {
    overflow: firstThatWorks('clip', 'hidden'),
    textOverflow: 'ellipsis',
    position: 'relative',
    maxWidth: '200px',
  },
})
