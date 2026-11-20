import {css} from '#styled-system/css'

export const popover = css({
  // The Popover's own wrapper Flex, which it renders around the content
  '& > div': {
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
})

export const noResultsText = css({
  wordBreak: 'break-word',
})
