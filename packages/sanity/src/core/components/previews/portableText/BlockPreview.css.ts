import {css} from '#styled-system/css'

export const headerFlex = css({
  // Flex (Box) sets `min-height: 0` on itself
  '&&': {
    // `PREVIEW_SIZES.block.media.height` (33px) in ../constants, written out because style values
    // stay literal for the build to rewrite this call statically. Change both together.
    minHeight: `${33 / 16}rem`,
  },
})
