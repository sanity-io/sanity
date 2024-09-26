import {describe, expect, it} from '@jest/globals'
import {firstValueFrom, of, Subject} from 'rxjs'
import {take, tap} from 'rxjs/operators'

import {type ClientLike, createObserveFields} from '../observeFields'
import {type InvalidationChannelEvent} from '../types'

describe('observeFields', () => {
  it('should cache the last known value and emit sync', async () => {
    const client: ClientLike = {
      observable: {
        fetch: (query) => {
          expect(query).toEqual('[*[_id in ["foo"]][0...1]{_id,_rev,_type,bar}][0...1]')
          return of([
            [
              // no result
            ],
          ])
        },
      },
      withConfig: () => client,
    }

    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observeFields = createObserveFields({
      invalidationChannel,
      client,
    })
    const first = firstValueFrom(observeFields('foo', ['bar']).pipe(take(1)))
    invalidationChannel.next({type: 'connected'})

    expect(await first).toMatchInlineSnapshot(`null`)

    // After we got first value from server and it turned out to be `null`, we should have `null` as the memoized sync value
    let syncValue = undefined
    observeFields('foo', ['bar'])
      .pipe(
        tap((value) => {
          syncValue = value
        }),
        take(1),
      )
      .subscribe()
      .unsubscribe()
    expect(syncValue).toBe(null)
  })
})
