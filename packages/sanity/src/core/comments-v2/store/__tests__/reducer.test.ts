import {describe, expect, it} from 'vitest'

import {comment} from '../__fixtures__/comment.fixture'
import {commentsReducer, type CommentsReducerState} from '../reducer'

describe('commentsReducer', () => {
  it('keeps the same state when the deleted comment is not in the store', () => {
    const state: CommentsReducerState = {comments: {c1: comment('c1', 'doc-1')}}

    expect(commentsReducer(state, {type: 'COMMENT_DELETED', id: 'elsewhere'})).toBe(state)
  })

  it('deletes a comment with its replies', () => {
    const state: CommentsReducerState = {
      comments: {
        c1: comment('c1', 'doc-1'),
        reply: comment('reply', 'doc-1', {parentCommentId: 'c1'}),
        c2: comment('c2', 'doc-1'),
      },
    }

    expect(
      Object.keys(commentsReducer(state, {type: 'COMMENT_DELETED', id: 'c1'}).comments),
    ).toEqual(['c2'])
  })
})
