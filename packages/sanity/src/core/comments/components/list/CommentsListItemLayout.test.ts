import {describe, expect, test} from 'vitest'

import {type CommentDocument} from '../../types'
import {getForeignCommentOrigin} from './CommentsListItemLayout'

function commentWithSource(sourceDocumentId: string | undefined) {
  return {target: {sourceDocumentId}} as CommentDocument
}

describe('getForeignCommentOrigin', () => {
  test('returns null when the comment was made on that document', () => {
    expect(getForeignCommentOrigin(commentWithSource('drafts.doc-1'), 'drafts.doc-1')).toBeNull()
  })

  test('returns null when origin is unknown', () => {
    expect(getForeignCommentOrigin(commentWithSource(undefined), 'drafts.doc-1')).toBeNull()
  })

  test('returns null when the viewed document is unknown', () => {
    expect(getForeignCommentOrigin(commentWithSource('drafts.doc-1'), undefined)).toBeNull()
  })

  test('returns published when comparing against a draft id', () => {
    expect(getForeignCommentOrigin(commentWithSource('doc-1'), 'drafts.doc-1')).toBe('published')
  })

  test('returns draft when comparing against a published id', () => {
    expect(getForeignCommentOrigin(commentWithSource('drafts.doc-1'), 'doc-1')).toBe('draft')
  })
})
