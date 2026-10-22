import {css, firstThatWorks} from '#styled-system/css'

export const searchFullscreenPortalCard = css({
  'height': '100%',
  'left': 0,
  'position': 'fixed',
  'top': 0,
  'width': '100%',
  'zIndex': 200,
  /** Card sets `overflow` from its `overflow="auto"` prop at (0,1,0); `&&` keeps this override winning. */
  '&&': {
    overflow: firstThatWorks('clip', 'hidden'),
  },
})
