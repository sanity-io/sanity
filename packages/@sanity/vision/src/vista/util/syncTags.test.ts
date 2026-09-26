import {describe, expect, it} from 'vitest'

import {getLiveRefetchTags, getMatchingSyncTags} from './syncTags'

describe('syncTags', () => {
  it('intersects event tags with the response tags, in event order', () => {
    expect(getMatchingSyncTags(['s1:c', 's1:a'], ['s1:a', 's1:b', 's1:c'])).toEqual([
      's1:c',
      's1:a',
    ])
    expect(getMatchingSyncTags(['s1:x'], ['s1:a'])).toEqual([])
    expect(getMatchingSyncTags(['s1:a'], undefined)).toEqual([])
    expect(getMatchingSyncTags([], ['s1:a'])).toEqual([])
  })

  it('decides whether a live event should refetch', () => {
    expect(getLiveRefetchTags(undefined, ['s1:a'])).toBeNull()
    expect(getLiveRefetchTags({type: 'welcome'}, ['s1:a'])).toBeNull()
    expect(getLiveRefetchTags({type: 'reconnect'}, ['s1:a'])).toBeNull()
    expect(getLiveRefetchTags({type: 'restart', id: '1'}, undefined)).toEqual([])
    expect(getLiveRefetchTags({type: 'message', id: '1', tags: ['s1:b']}, ['s1:a'])).toBeNull()
    expect(getLiveRefetchTags({type: 'message', id: '1', tags: ['s1:a']}, ['s1:a'])).toEqual([
      's1:a',
    ])
  })
})
