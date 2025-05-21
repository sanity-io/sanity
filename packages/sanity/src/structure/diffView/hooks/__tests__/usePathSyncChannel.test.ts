import {renderHook} from '@testing-library/react'
import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type PathSyncState} from '../types/pathSyncChannel'
import {usePathSyncChannel} from '../usePathSyncChannel'

describe('usePathSyncChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('push sends state with source id', () => {
    const syncChannel = new Subject<PathSyncState>()
    const {result} = renderHook(() => usePathSyncChannel({syncChannel, id: 'pane'}))
    const spy = vi.spyOn(syncChannel, 'next')

    result.current.push({path: ['foo']})
    expect(spy).toHaveBeenCalledWith({path: ['foo'], source: 'pane'})
  })

  it('path emits changes from other sources and ignores duplicates', () => {
    const syncChannel = new Subject<PathSyncState>()
    const {result} = renderHook(() => usePathSyncChannel({syncChannel, id: 'a'}))
    const values: any[] = []
    const sub = result.current.path.subscribe((v) => values.push(v))

    syncChannel.next({path: ['foo'], source: 'a'})
    syncChannel.next({path: ['foo'], source: 'b'})
    syncChannel.next({path: ['foo'], source: 'b'})
    syncChannel.next({path: ['bar'], source: 'b'})
    sub.unsubscribe()

    expect(values).toEqual([['foo'], ['bar']])
  })
})
