import {globalStyle, style} from '@vanilla-extract/css'

export const popover = style({})

// `& > div` in the original: the subject is the Popover's wrapper Flex, not `&`
globalStyle(`${popover} > div`, {
  overflow: 'auto',
  WebkitOverflowScrolling: 'touch',
})

export const noResultsText = style({
  wordBreak: 'break-word',
})
