import {defineEvent} from '@sanity/telemetry'

import {type CommentStatus} from '../types'

export const CommentLinkCopied = defineEvent({
  name: 'Comment Link Copied',
  version: 1,
  description: 'The link to a comment is copied',
})

export const CommentViewedFromLink = defineEvent({
  name: 'Comment Viewed From Link',
  version: 1,
  description: 'A comment is viewed from a link',
})

export const CommentListViewChanged = defineEvent<{view: CommentStatus}>({
  name: 'Comment List View Changed',
  version: 1,
  description: 'The view of the comment list is changed',
})
