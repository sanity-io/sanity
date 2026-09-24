import {globalStyle, style} from '@vanilla-extract/css'

export const searchResultItemPreviewBox = style({})

/**
 * Temporary workaround: force all nested boxes on iOS to use `background-attachment: scroll`
 * to allow <Skeleton> components to render correctly within virtual lists.
 */
globalStyle(`${searchResultItemPreviewBox} * [data-ui='Box']`, {
  '@supports': {
    '(-webkit-overflow-scrolling: touch)': {
      backgroundAttachment: 'scroll',
    },
  },
})
