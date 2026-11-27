import {Observable, Subject} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {withMaxConcurrency} from './withMaxConcurrency'

function createTrackedFactory() {
  const started: string[] = []
  const active = new Set<string>()
  const inners = new Map<string, Subject<string>>()

  const factory = (id: string) =>
    new Observable<string>((subscriber) => {
      started.push(id)
      active.add(id)
      const inner = new Subject<string>()
      inners.set(id, inner)
      const subscription = inner.subscribe(subscriber)
      return () => {
        active.delete(id)
        subscription.unsubscribe()
      }
    })

  return {
    factory,
    started: () => [...started],
    active: () => [...active],
    next: (id: string, value: string) => inners.get(id)?.next(value),
    complete: (id: string) => inners.get(id)?.complete(),
    error: (id: string, err: Error) => inners.get(id)?.error(err),
  }
}

describe('withMaxConcurrency', () => {
  it('forwards values and completion from the inner observable', () => {
    const {factory, next, complete} = createTrackedFactory()
    const throttled = withMaxConcurrency(factory, 1)
    const values: string[] = []
    const completed: boolean[] = []

    throttled('a').subscribe({
      next: (value) => values.push(value),
      complete: () => completed.push(true),
    })

    next('a', 'one')
    next('a', 'two')
    complete('a')

    expect(values).toEqual(['one', 'two'])
    expect(completed).toEqual([true])
  })

  it('subscribes to every inner observable immediately when under the limit', () => {
    const {factory, started, active} = createTrackedFactory()
    const throttled = withMaxConcurrency(factory, 2)

    throttled('a').subscribe()
    throttled('b').subscribe()

    expect(started()).toEqual(['a', 'b'])
    expect(active().toSorted()).toEqual(['a', 'b'])
  })

  it('holds later inner observables until an in-flight one completes', () => {
    const {factory, started, active, complete} = createTrackedFactory()
    const throttled = withMaxConcurrency(factory, 1)
    const values: string[] = []

    throttled('a').subscribe()
    throttled('b').subscribe({next: (value) => values.push(value)})

    expect(started()).toEqual(['a'])
    expect(active()).toEqual(['a'])

    complete('a')

    expect(started()).toEqual(['a', 'b'])
    expect(active()).toEqual(['b'])
  })

  it('starts the next queued observable when an in-flight subscriber unsubscribes', () => {
    const {factory, started, active} = createTrackedFactory()
    const throttled = withMaxConcurrency(factory, 1)

    const first = throttled('a').subscribe()
    throttled('b').subscribe()

    expect(started()).toEqual(['a'])

    first.unsubscribe()

    expect(started()).toEqual(['a', 'b'])
    expect(active()).toEqual(['b'])
  })

  it('does not start a queued observable that was unsubscribed before it ran', () => {
    const {factory, started, active, complete} = createTrackedFactory()
    const throttled = withMaxConcurrency(factory, 1)

    throttled('a').subscribe()
    const queued = throttled('b').subscribe()
    throttled('c').subscribe()

    queued.unsubscribe()
    complete('a')

    expect(started()).toEqual(['a', 'c'])
    expect(active()).toEqual(['c'])
  })

  it('starts the next queued observable when an in-flight one errors', () => {
    const {factory, started, active, error} = createTrackedFactory()
    const throttled = withMaxConcurrency(factory, 1)
    const errors: unknown[] = []

    throttled('a').subscribe({error: (err) => errors.push(err)})
    throttled('b').subscribe()

    const boom = new Error('upload failed')
    error('a', boom)

    expect(errors).toEqual([boom])
    expect(started()).toEqual(['a', 'b'])
    expect(active()).toEqual(['b'])
  })

  it('does not share a queue between wrapper instances', () => {
    const {factory, started} = createTrackedFactory()
    const first = withMaxConcurrency(factory, 1)
    const second = withMaxConcurrency(factory, 1)

    first('a').subscribe()
    second('b').subscribe()

    expect(started()).toEqual(['a', 'b'])
  })

  it('defaults to four concurrent inner observables', () => {
    const {factory, started, active, complete} = createTrackedFactory()
    const throttled = withMaxConcurrency(factory)

    throttled('a').subscribe()
    throttled('b').subscribe()
    throttled('c').subscribe()
    throttled('d').subscribe()
    throttled('e').subscribe()

    expect(started()).toEqual(['a', 'b', 'c', 'd'])
    expect(active().toSorted()).toEqual(['a', 'b', 'c', 'd'])

    complete('a')

    expect(started()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})
