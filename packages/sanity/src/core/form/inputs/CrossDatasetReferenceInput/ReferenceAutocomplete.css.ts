import {css} from '#styled-system/css'

export const popover = css({
  // `& > div` in the original: the subject is the Popover's wrapper Flex, not `&`
  '& > div': {
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
})

export const noResultsText = css({
  wordBreak: 'break-word',
})
