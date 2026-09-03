import {globalStyle, style} from '@vanilla-extract/css'

export const cardWrapper = style({
  selectors: {
    // `&&`: Card (Box) sets `box-sizing` on itself through its `sizing` prop
    '&&': {
      boxSizing: 'border-box',
    },
  },
})

export const flexWrapper = style({
  textOverflow: 'ellipsis',
  selectors: {
    // `&&`: Flex (Box) sets `box-sizing` and `overflow` on itself through its props
    '&&': {
      boxSizing: 'border-box',
      overflow: ['hidden', 'clip'],
    },
  },
})

export const leftSection = style({
  position: 'relative',
  width: '60%',
})

export const codeWrapper = style({
  width: '100%',
  selectors: {
    // `&&`: Code sets `position: relative` on itself
    '&&': {
      position: 'relative',
    },
  },
})

globalStyle(`${codeWrapper} code`, {
  overflow: ['hidden', 'clip'],
  textOverflow: 'ellipsis',
  position: 'relative',
  maxWidth: '200px',
})
