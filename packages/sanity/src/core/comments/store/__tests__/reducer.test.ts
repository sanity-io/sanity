import {describe, expect, it} from 'vitest'

import {comment} from '../../../store/addonDatasetListener/__fixtures__/addonDataset.fixture'
import {commentsReducer, type CommentsReducerState} from '../reducer'

describe('commentsReducer', () => {
  it('keeps the same state when the deleted comment is not in the store', () => {
    const state: CommentsReducerState = {comments: {'c-a': comment('c-a', 'doc-a')}}

    expect(commentsReducer(state, {type: 'COMMENT_DELETED', id: 'elsewhere'})).toBe(state)
  })

  it('deletes a comment with its replies', () => {
    const state: CommentsReducerState = {
      comments: {
        'c-a': comment('c-a', 'doc-a'),
        'reply': comment('reply', 'doc-a', {parentCommentId: 'c-a'}),
        'c-b': comment('c-b', 'doc-a'),
      },
    }

    const next = commentsReducer(state, {type: 'COMMENT_DELETED', id: 'c-a'})

    expect(Object.keys(next.comments)).toEqual(['c-b'])
  })

  it('deletes the replies to a deleted comment the store does not have', () => {
    const state: CommentsReducerState = {
      comments: {reply: comment('reply', 'doc-a', {parentCommentId: 'c-a'})},
    }

    const next = commentsReducer(state, {type: 'COMMENT_DELETED', id: 'c-a'})

    expect(next.comments).toEqual({})
  })
})
