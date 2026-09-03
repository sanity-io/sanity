import {style} from '@vanilla-extract/css'

/*
 * Prevent the block size of appended elements (such as the deprecated field badge) affecting
 * the intrinsic block size of the label, while still allowing the inline size (width) to
 * expand naturally to fit its content.
 */
export const labelSuffix = style({
  selectors: {
    // Flex (Box) sets height and overflow on itself
    '&&': {
      height: 0,
      overflow: 'visible',
    },
  },
})
