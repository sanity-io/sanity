import {css, firstThatWorks} from '#styled-system/css'

import {PREVIEW_SIZES} from '../constants'

export const rootFlex = css({
  // Flex (Box) sets height on itself
  '&&': {
    height: `${PREVIEW_SIZES.detail.media.height / 16}rem`,
  },
})

export const statusBox = css({
  whiteSpace: 'nowrap',
})

export const mediaSkeleton = css({
  // Skeleton sets its own dimensions
  '&&': {
    width: `${PREVIEW_SIZES.detail.media.width / 16}rem`,
    height: `${PREVIEW_SIZES.detail.media.height / 16}rem`,
  },
})

export const titleSkeleton = css({
  'maxWidth': `${160 / 16}rem`,
  /* 80% of 200px */
  // TextSkeleton sets its own dimensions
  '&&': {
    width: '80%',
  },
})

export const subtitleSkeleton = css({
  'maxWidth': `${120 / 16}rem`,
  /* 60% of 200px */
  // TextSkeleton sets its own dimensions
  '&&': {
    width: '60%',
  },
})

export const descriptionSkeleton = css({
  'maxWidth': `${180 / 16}rem`,
  /* 90% of 200px */
  // TextSkeleton sets its own dimensions
  '&&': {
    width: '90%',
  },
})

export const descriptionTextMaxHeightVar = '--detail-preview-description-text-max-height'

// csstype marks `-webkit-box-orient` obsolete, but `-webkit-line-clamp` only clamps together with
// `display: -webkit-box` and this declaration, so it is kept exactly as the original rule had it
const webkitBoxOrientVertical = {WebkitBoxOrient: 'vertical'} as const

export const descriptionText = css({
  // Text sets `& > span {display: block}` on itself; the doubled class outranks it
  '&& > span': {
    maxHeight: `var(${descriptionTextMaxHeightVar})`,
    /* Multi-line text overflow */
    display: '[-webkit-box]',
    overflow: firstThatWorks('clip', 'hidden'),
    textOverflow: 'ellipsis',
    WebkitLineClamp: 2,
    ...webkitBoxOrientVertical,
  },
})
