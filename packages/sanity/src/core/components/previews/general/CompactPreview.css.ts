import {css} from '#styled-system/css'

export const root = css({
  // Flex (Box) sets height and box-sizing on itself
  '&&': {
    // `PREVIEW_SIZES.compact.media.height` (25px) in ../constants, written out because style
    // values stay literal for the build to rewrite this call statically. Change both together.
    height: `${25 / 16}rem`,
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
