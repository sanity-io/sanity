import {CommentReactionItem} from '../types'
import {mergeCommentReactions} from '../utils/mergeCommentReactions'

const REACTIONS_A: CommentReactionItem[] = [
  {
    userId: 'user-1',
    shortName: ':rocket:',
    _key: 'key-1',
    addedAt: '2021-01-01T00:00:00.000Z',
  },
  {
    userId: 'user-2',
    shortName: ':+1:',
    _key: 'key-2',
    addedAt: '2021-01-01T00:00:00.000Z',
  },
  {
    userId: 'user-3',
    shortName: ':-1:',
    _key: 'key-3',
    addedAt: '2021-01-01T00:00:00.000Z',
  },
  {
    userId: 'user-4',
    shortName: ':rocket:',
    _key: 'key-4',
    addedAt: '2021-01-01T00:00:00.000Z',
  },
]

const REACTIONS_B: CommentReactionItem[] = [
  {
    userId: 'user-1',
    shortName: ':rocket:',
    _key: 'key-1',
    addedAt: '2021-01-01T00:00:00.000Z',
    _optimisticState: 'removed',
  },
  {
    userId: 'user-2',
    shortName: ':+1:',
    _key: 'key-2',
    addedAt: '2021-01-01T00:00:00.000Z',
    _optimisticState: 'added',
  },
  {
    userId: 'user-3',
    addedAt: '2021-01-01T00:00:00.000Z',
    shortName: ':heart_eyes:',
    _key: 'key-5',
  },
]

describe('comments: mergeCommentReactions', () => {
  it('merges reactions correctly', () => {
    const merged = mergeCommentReactions(REACTIONS_A, REACTIONS_B)

    expect(merged).toEqual([
      {
        userId: 'user-1',
        shortName: ':rocket:',
        _key: 'key-1',
        addedAt: '2021-01-01T00:00:00.000Z',
        _optimisticState: 'removed',
      },
      {
        userId: 'user-2',
        shortName: ':+1:',
        _key: 'key-2',
        addedAt: '2021-01-01T00:00:00.000Z',
        _optimisticState: 'added',
      },
      {
        userId: 'user-3',
        shortName: ':-1:',
        addedAt: '2021-01-01T00:00:00.000Z',
        _key: 'key-3',
      },
      {
        userId: 'user-4',
        shortName: ':rocket:',
        addedAt: '2021-01-01T00:00:00.000Z',
        _key: 'key-4',
      },
      {
        userId: 'user-3',
        shortName: ':heart_eyes:',
        addedAt: '2021-01-01T00:00:00.000Z',
        _key: 'key-5',
      },
    ])
  })
})
