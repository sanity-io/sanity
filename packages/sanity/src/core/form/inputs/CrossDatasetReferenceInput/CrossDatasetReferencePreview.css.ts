import {css} from '#styled-system/css'

export const previewFlex = css({
  // `&&`: Flex (Box) sets `min-height: 0` itself
  '&&': {
    /* this is a hack to avoid layout jumps while previews are loading
          or the message is not tall enough to fill the card
          there's probably better ways of solving this */
    minHeight: '36px',
  },
})
