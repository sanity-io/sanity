import {style} from '@vanilla-extract/css'

/**
 * Temporary workaround: force all nested boxes on iOS to use `background-attachment: scroll`
 * to allow <Skeleton> components to render correctly within virtual lists.
 */
export const searchResultItemPreviewBox = style({})
