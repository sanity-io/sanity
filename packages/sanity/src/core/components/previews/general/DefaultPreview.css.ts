import {css} from '#styled-system/css'

import {PREVIEW_SIZES} from '../constants'

export const root = css({
  // Flex (Box) sets height and box-sizing on itself
  '&&': {
    height: `${PREVIEW_SIZES.default.media.height / 16}rem`,
    boxSizing: 'content-box',
  },
})

export const titleSkeleton = css({
  'maxWidth': `${160 / 16}rem`,
  // TextSkeleton sets its own dimensions
  '&&': {
    width: '80%',
  },
})

export const subtitleSkeleton = css({
  'maxWidth': `${120 / 16}rem`,
  // TextSkeleton sets its own dimensions
  '&&': {
    width: '60%',
  },
})
