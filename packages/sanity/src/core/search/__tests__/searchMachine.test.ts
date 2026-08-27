import {Observable, Subject} from 'rxjs'
import {describe, expect, it} from 'vitest'
import {createActor, fromObservable, SimulatedClock} from 'xstate'

import {defineSearchMachine, type SearchMachineEmitted} from '../searchMachine'

interface HarnessOptions {
  debounceMs?: number
  distinct?: boolean
  searchable?: (query: string) => boolean
}

function createHarness(options: HarnessOptions = {}) {
  const started: string[] = []
  const subjects = new Map<string, Subject<string[]>>()
  const emitted: SearchMachineEmitted<string[]>[] = []
  const clock = new SimulatedClock()

  const machine = defineSearchMachine<string, string[]>().provide({
    actors: {
      search: fromObservable(
        ({input}: {input: {query: string}}) =>
          new Observable<string[]>((subscriber) => {
            started.push(input.query)
            const subject = new Subject<string[]>()
            subjects.set(input.query, subject)
            const subscription = subject.subscribe(subscriber)
            return () => subscription.unsubscribe()
          }),
      ),
    },
    guards: {
      'is same query': ({context, event}) =>
        (options.distinct ?? false) && context.query === event.query,
      'should search': ({context}) => options.searchable?.(context.query ?? '') ?? true,
    },
  })

  const actor = createActor(machine, {clock, input: {debounceMs: options.debounceMs}})
  actor.on('search started', (event) => emitted.push(event))
  actor.on('search completed', (event) => emitted.push(event))
  actor.on('search failed', (event) => emitted.push(event))
  actor.on('search skipped', (event) => emitted.push(event))
  actor.start()

  return {
    actor,
    clock,
    started,
    subjects,
    emitted,
    search: (query: string) => actor.send({type: 'search', query}),
    resolve: (query: string, hits: string[]) => {
      const subject = subjects.get(query)
      if (!subject) throw new Error(`no search started for "${query}"`)
      subject.next(hits)
      subject.complete()
    },
    fail: (query: string, error: Error) => {
      const subject = subjects.get(query)
      if (!subject) throw new Error(`no search started for "${query}"`)
      subject.error(error)
    },
  }
}

describe('searchMachine', () => {
  it('runs a search and exposes the result', () => {
    const harness = createHarness()

    harness.search('foo')
    harness.clock.increment(0)
    expect(harness.actor.getSnapshot().matches('searching')).toBe(true)
    expect(harness.started).toEqual(['foo'])

    harness.resolve('foo', ['hit-1', 'hit-2'])
    const snapshot = harness.actor.getSnapshot()
    expect(snapshot.matches('success')).toBe(true)
    expect(snapshot.context.result).toEqual(['hit-1', 'hit-2'])
    expect(snapshot.context.settledQuery).toBe('foo')
    expect(harness.emitted).toEqual([
      {type: 'search started'},
      {type: 'search completed', result: ['hit-1', 'hit-2']},
    ])
  })

  it('keeps streaming results from a live search observable that never completes', () => {
    const harness = createHarness()

    harness.search('foo')
    harness.clock.increment(0)
    const subject = harness.subjects.get('foo')!

    subject.next(['first'])
    expect(harness.actor.getSnapshot().matches({searching: 'streaming'})).toBe(true)
    expect(harness.actor.getSnapshot().context.result).toEqual(['first'])
    expect(harness.actor.getSnapshot().context.settledQuery).toBe('foo')

    subject.next(['first', 'second'])
    expect(harness.actor.getSnapshot().matches({searching: 'streaming'})).toBe(true)
    expect(harness.actor.getSnapshot().context.result).toEqual(['first', 'second'])
    expect(harness.emitted).toEqual([
      {type: 'search started'},
      {type: 'search completed', result: ['first']},
      {type: 'search completed', result: ['first', 'second']},
    ])

    harness.search('bar')
    harness.clock.increment(0)
    expect(subject.observed).toBe(false)
  })

  it('cancels the in-flight search when a new query arrives', () => {
    const harness = createHarness()

    harness.search('first')
    harness.clock.increment(0)
    harness.search('second')
    harness.clock.increment(0)

    expect(harness.started).toEqual(['first', 'second'])
    expect(harness.subjects.get('first')!.observed).toBe(false)

    harness.subjects.get('first')!.next(['stale'])
    harness.resolve('second', ['fresh'])

    const snapshot = harness.actor.getSnapshot()
    expect(snapshot.matches('success')).toBe(true)
    expect(snapshot.context.result).toEqual(['fresh'])
  })

  it('debounces queries within the window and searches the latest one', () => {
    const harness = createHarness({debounceMs: 300})

    harness.search('f')
    harness.clock.increment(200)
    harness.search('fo')
    harness.clock.increment(200)
    expect(harness.started).toEqual([])

    harness.clock.increment(100)
    expect(harness.started).toEqual(['fo'])
  })

  it('swallows a repeated query when the distinct guard is provided', () => {
    const harness = createHarness({distinct: true})

    harness.search('foo')
    harness.clock.increment(0)
    harness.resolve('foo', ['hit'])
    harness.search('foo')
    harness.clock.increment(0)

    expect(harness.started).toEqual(['foo'])
    expect(harness.actor.getSnapshot().matches('success')).toBe(true)
  })

  it('repeats a query without the distinct guard', () => {
    const harness = createHarness()

    harness.search('foo')
    harness.clock.increment(0)
    harness.resolve('foo', ['hit'])
    harness.search('foo')
    harness.clock.increment(0)

    expect(harness.started).toEqual(['foo', 'foo'])
  })

  it('skips the fetch when the should-search guard rejects', () => {
    const harness = createHarness({searchable: (query) => query.length > 0})

    harness.search('')
    harness.clock.increment(0)

    const snapshot = harness.actor.getSnapshot()
    expect(snapshot.matches('skipped')).toBe(true)
    expect(snapshot.context.result).toBeNull()
    expect(snapshot.context.settledQuery).toBe('')
    expect(harness.started).toEqual([])
    expect(harness.emitted).toEqual([{type: 'search skipped'}])
  })

  it('reports failures and clears the result', () => {
    const harness = createHarness()
    const error = new Error('search exploded')

    harness.search('foo')
    harness.clock.increment(0)
    harness.fail('foo', error)

    const snapshot = harness.actor.getSnapshot()
    expect(snapshot.matches('failure')).toBe(true)
    expect(snapshot.context.error).toBe(error)
    expect(snapshot.context.result).toBeNull()
    expect(harness.emitted).toEqual([{type: 'search started'}, {type: 'search failed', error}])
  })

  it('recovers from a failure on the next search', () => {
    const harness = createHarness()

    harness.search('bad')
    harness.clock.increment(0)
    harness.fail('bad', new Error('nope'))
    harness.search('good')
    harness.clock.increment(0)
    harness.resolve('good', ['hit'])

    const snapshot = harness.actor.getSnapshot()
    expect(snapshot.matches('success')).toBe(true)
    expect(snapshot.context.error).toBeNull()
    expect(snapshot.context.result).toEqual(['hit'])
  })

  it('keeps settledQuery at the last settled search while one is in flight', () => {
    const harness = createHarness()

    harness.search('first')
    harness.clock.increment(0)
    harness.resolve('first', ['hit'])
    harness.search('second')
    harness.clock.increment(0)

    expect(harness.actor.getSnapshot().context.settledQuery).toBe('first')
  })
})
