import {concat, from, lastValueFrom, of, share, timer} from 'rxjs'
import {concatMap, delay, mergeMap, take, toArray} from 'rxjs/operators'
import {expect, test} from 'vitest'

import {shareReplayLatest} from './shareReplayLatest'

test('replayLatest() replays matching value to new subscribers', async () => {
  const observable = from(['foo', 'bar', 'baz']).pipe(
    concatMap((value) => of(value).pipe(delay(100))),
    share(),
    shareReplayLatest((v) => v === 'foo'),
  )

  const result = observable.pipe(
    mergeMap((value) =>
      value === 'bar' ? concat(of(value), observable.pipe(take(1))) : of(value),
    ),
    toArray(),
  )
  expect(await lastValueFrom(result)).toEqual(['foo', 'bar', 'foo', 'baz'])
})

test('replayLatest() doesnt keep the replay value after resets', async () => {
  const observable = timer(0, 10).pipe(
    shareReplayLatest({
      resetOnRefCountZero: true,
      resetOnComplete: true,
      predicate: (v) => v < 2,
    }),
  )

  const result = observable.pipe(take(5), toArray())
  expect(await lastValueFrom(result)).toEqual([0, 1, 2, 3, 4])

  const resultAfter = observable.pipe(take(5), toArray())
  expect(await lastValueFrom(resultAfter)).toEqual([0, 1, 2, 3, 4])
})
