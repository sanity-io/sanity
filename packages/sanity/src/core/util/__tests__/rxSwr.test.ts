import {lastValueFrom, timer} from 'rxjs'
import {map, toArray} from 'rxjs/operators'
import {describe, expect, it} from 'vitest'

import {createSWR} from '../rxSwr'

describe('rxSwr', () => {
  it('should cache the last known value and emit sync', async () => {
    const swr = createSWR({maxSize: 1})

    const observable = timer(100).pipe(
      map(() => 'value!'),
      swr('someKey'),
      toArray(),
    )

    expect(await lastValueFrom(observable)).toEqual([{fromCache: false, value: 'value!'}])

    // Second subscription, now with warm cache
    expect(await lastValueFrom(observable)).toEqual([
      {fromCache: true, value: 'value!'},
      {fromCache: false, value: 'value!'},
    ])
  })

  it('should discard old cache keys when exceeding maxSize', async () => {
    const swr = createSWR({maxSize: 1})

    const observable1 = timer(100).pipe(
      map(() => 'observable1!'),
      swr('key1'),
      toArray(),
    )

    expect(await lastValueFrom(observable1)).toEqual([{fromCache: false, value: 'observable1!'}])

    // Second subscription, now with warm cache
    expect(await lastValueFrom(observable1)).toEqual([
      {fromCache: true, value: 'observable1!'},
      {fromCache: false, value: 'observable1!'},
    ])

    const observable2 = timer(100).pipe(
      map(() => 'observable2!'),
      swr('key2'),
      toArray(),
    )

    // Subscribing to observable2 should purge the key of observable1
    expect(await lastValueFrom(observable2)).toEqual([{fromCache: false, value: 'observable2!'}])

    // re-subscribing to the first should now not have a cache
    expect(await lastValueFrom(observable1)).toEqual([{fromCache: false, value: 'observable1!'}])
  })
})
