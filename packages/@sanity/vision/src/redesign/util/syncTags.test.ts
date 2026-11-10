import {type SyncTag} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {getLiveRefetchTags, getMatchingSyncTags, sortSyncTags} from './syncTags'

describe('syncTags', () => {
  it('sorts tags alphabetically for showing them, leaving the list it got alone', () => {
    const tags: SyncTag[] = ['s1:eaqm2Q', 's1:CYWFwA', 's1:9frH5w', 's1:3JECog', 's1:fBkYyQ']
    expect(sortSyncTags(tags)).toEqual([
      's1:3JECog',
      's1:9frH5w',
      's1:CYWFwA',
      's1:eaqm2Q',
      's1:fBkYyQ',
    ])
    expect(tags[0]).toBe('s1:eaqm2Q')
    // The same tags in any order sort the same
    expect(sortSyncTags(tags.toReversed())).toEqual(sortSyncTags(tags))
  })

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
    // Changes made while the connection was down sent no message
    expect(getLiveRefetchTags({type: 'reconnect'}, ['s1:a'])).toEqual([])
    expect(getLiveRefetchTags({type: 'restart', id: '1'}, undefined)).toEqual([])
    expect(getLiveRefetchTags({type: 'message', id: '1', tags: ['s1:b']}, ['s1:a'])).toBeNull()
    expect(getLiveRefetchTags({type: 'message', id: '1', tags: ['s1:a']}, ['s1:a'])).toEqual([
      's1:a',
    ])
  })
})
