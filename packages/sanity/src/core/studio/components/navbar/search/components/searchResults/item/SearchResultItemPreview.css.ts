import {css} from '#styled-system/css'

export const searchResultItemPreviewBox = css({
  /**
   * Temporary workaround: force all nested boxes on iOS to use `background-attachment: scroll`
   * to allow <Skeleton> components to render correctly within virtual lists.
   */
  "& * [data-ui='Box']": {
    '@supports (-webkit-overflow-scrolling: touch)': {
      backgroundAttachment: 'scroll',
    },
  },
})
