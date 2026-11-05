import {from, lastValueFrom, map, merge, Subject, throwError, timer} from 'rxjs'
import {concatMap, mergeMap, toArray} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, onTestFinished, test, vi} from 'vitest'

import {type InitialSnapshotEvent, type ListenerEvent} from '../../getPairListener'
import {
  DeadlineExceededError,
  MaxBufferExceededError,
  OutOfSyncError,
  sequentializeListenerEvents,
} from '../sequentializeListenerEvents'
import {creationEvent, mutationEvent} from './test-utils'

const now = () => new Date().toString()

test("it accumulates events that doesn't apply in a chain starting at the current head revision", async () => {
  const events = from([
    {
      type: 'snapshot',
      documentId: 'test',
      document: {
        _rev: 'one',
        _id: 'test',
        _type: 'test',
        name: 'initial',
        _createdAt: '2024-10-02T06:40:16.414Z',
        _updatedAt: '2024-10-02T06:40:16.414Z',
      },
    },
    // this has the snapshot revision as it's previous and should be passed on as-is
    mutationEvent({
      previousRev: 'one',
      resultRev: 'two',
      messageReceivedAt: now(),
      mutations: [{patch: {set: {name: 'OK'}}}],
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'four',
      resultRev: 'five',
      messageReceivedAt: now(),
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'three',
      resultRev: 'four',
      messageReceivedAt: now(),
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // we have a complete unbroken chain when receiving this
    mutationEvent({
      previousRev: 'two',
      resultRev: 'three',
      messageReceivedAt: now(),
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
  ] satisfies ListenerEvent[])

  expect(
    (await lastValueFrom(events.pipe(sequentializeListenerEvents(), toArray()))).map((event) => {
      return [
        event.type,
        event.type === 'mutation'
          ? event.previousRev
          : event.type === 'snapshot'
            ? event.document?._rev
            : null,
      ]
    }),
  ).toEqual([
    ['snapshot', 'one'],
    ['mutation', 'one'],
    ['mutation', 'two'],
    ['mutation', 'three'],
    ['mutation', 'four'],
  ])
})

test('it ignores events already applied to the current head revision', async () => {
  const events = from([
    {
      type: 'snapshot',
      documentId: 'test',
      document: {
        _rev: 'one',
        _id: 'test',
        _type: 'test',
        name: 'initial',
        _createdAt: '2024-10-02T06:40:16.414Z',
        _updatedAt: '2024-10-02T06:40:16.414Z',
      },
    },
    // this is already applied to the snapshot emitted above and should be ignored
    mutationEvent({
      previousRev: 'minus-one',
      resultRev: 'zero',
      mutations: [{patch: {set: {name: 'SHOULD BE IGNORED'}}}],
      messageReceivedAt: now(),
    }),
    // this is already applied to the snapshot emitted above and should be ignored
    mutationEvent({
      previousRev: 'zero',
      resultRev: 'one',
      mutations: [{patch: {set: {name: 'SHOULD ALSO BE IGNORED'}}}],
      messageReceivedAt: now(),
    }),
    // this has the snapshot revision as it's previous and should be applied
    mutationEvent({
      previousRev: 'one',
      resultRev: 'two',
      mutations: [{patch: {set: {name: 'SHOULD BE APPLIED'}}}],
      messageReceivedAt: now(),
    }),
  ] satisfies ListenerEvent[])

  expect(
    (await lastValueFrom(events.pipe(sequentializeListenerEvents(), toArray()))).map((event) => {
      return event?.type === 'mutation' ? event.mutations : event?.type
    }),
  ).toEqual(['snapshot', [{patch: {set: {name: 'SHOULD BE APPLIED'}}}]])
})

test('it throws an MaxBufferExceededError if the buffer exceeds `maxBuffer`', async () => {
  const events = from([
    {
      type: 'snapshot',
      documentId: 'test',

      document: {
        _rev: 'one',
        _id: 'test',
        _type: 'test',
        name: 'initial',
        _createdAt: '2024-10-02T06:40:16.414Z',
        _updatedAt: '2024-10-02T06:40:16.414Z',
      },
    },
    // this has the snapshot revision as it's previous and should be passed on as-is
    mutationEvent({
      previousRev: 'one',
      resultRev: 'two',
      mutations: [{patch: {set: {name: 'OK'}}}],
      messageReceivedAt: now(),
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'four',
      resultRev: 'five',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
      messageReceivedAt: now(),
    }),
    // this breaks the chain
    mutationEvent({
      previousRev: 'six',
      resultRev: 'seven',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
      messageReceivedAt: now(),
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'three',
      resultRev: 'four',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
      messageReceivedAt: now(),
    }),
    // we have a complete unbroken chain when receiving this
    mutationEvent({
      previousRev: 'two',
      resultRev: 'three',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
      messageReceivedAt: now(),
    }),
  ] satisfies ListenerEvent[])

  await expect(
    lastValueFrom(events.pipe(sequentializeListenerEvents({maxBufferSize: 3}), toArray())),
  ).rejects.toThrow(MaxBufferExceededError)
})

test('it throws an OutOfSyncError if the buffer exceeds `maxBuffer`', async () => {
  const events = from([
    {
      type: 'snapshot',
      documentId: 'test',
      document: {
        _rev: 'one',
        _id: 'test',
        _type: 'test',
        name: 'initial',
        _createdAt: '2024-10-02T06:40:16.414Z',
        _updatedAt: '2024-10-02T06:40:16.414Z',
      },
    },
    // this has the snapshot revision as it's previous and should be passed on as-is
    mutationEvent({
      previousRev: 'one',
      resultRev: 'two',
      mutations: [{patch: {set: {name: 'OK'}}}],
      messageReceivedAt: now(),
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'four',
      resultRev: 'five',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
      messageReceivedAt: now(),
    }),
    // this breaks the chain
    mutationEvent({
      previousRev: 'six',
      resultRev: 'seven',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
      messageReceivedAt: now(),
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'three',
      resultRev: 'four',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
      messageReceivedAt: now(),
    }),
    // we have a complete unbroken chain when receiving this
    mutationEvent({
      previousRev: 'two',
      resultRev: 'three',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
      messageReceivedAt: now(),
    }),
  ] satisfies ListenerEvent[])

  await expect(
    lastValueFrom(events.pipe(sequentializeListenerEvents({resolveChainDeadline: 100}), toArray())),
  ).rejects.toThrow(DeadlineExceededError)
})

test('it throws an OutOfSyncError after `resolveChainDeadline` ms has passed', async () => {
  const events = from([
    {
      type: 'snapshot',
      documentId: 'test',
      document: {
        _rev: 'one',
        _id: 'test',
        _type: 'test',
        name: 'initial',
        _createdAt: '2024-10-02T06:40:16.414Z',
        _updatedAt: '2024-10-02T06:40:16.414Z',
      },
    },
    // this has the snapshot revision as it's previous and should be passed on as-is
    mutationEvent({
      previousRev: 'one',
      resultRev: 'two',
      mutations: [{patch: {set: {name: 'OK'}}}],
      messageReceivedAt: now(),
    }),
    // this breaks the chain (three is missing)
    mutationEvent({
      previousRev: 'three',
      resultRev: 'four',
      mutations: [{patch: {set: {name: 'four'}}}],
      messageReceivedAt: now(),
    }),
    mutationEvent({
      previousRev: 'four',
      resultRev: 'five',
      mutations: [{patch: {set: {name: 'five'}}}],
      messageReceivedAt: now(),
    }),
    mutationEvent({
      previousRev: 'five',
      resultRev: 'six',
      mutations: [{patch: {set: {name: 'six'}}}],
      messageReceivedAt: now(),
    }),
    mutationEvent({
      previousRev: 'seven',
      resultRev: 'eight',
      mutations: [{patch: {set: {name: 'eight'}}}],
      messageReceivedAt: now(),
    }),
    mutationEvent({
      previousRev: 'eight',
      resultRev: 'nine',
      mutations: [{patch: {set: {name: 'nine'}}}],
      messageReceivedAt: now(),
    }),
    mutationEvent({
      previousRev: 'nine',
      resultRev: 'ten',
      mutations: [{patch: {set: {name: 'ten'}}}],
      messageReceivedAt: now(),
    }),
    mutationEvent({
      previousRev: 'ten',
      resultRev: 'eleven',
      mutations: [{patch: {set: {name: 'eleven'}}}],
      messageReceivedAt: now(),
    }),
    mutationEvent({
      previousRev: 'eleven',
      resultRev: 'twelve',
      mutations: [{patch: {set: {name: 'twelve'}}}],
      messageReceivedAt: now(),
    }),
  ] satisfies ListenerEvent[])

  const start = new Date()
  await expect(
    lastValueFrom(
      merge(
        timer(400).pipe(
          mergeMap(() => throwError(() => new Error('Expected deadline to be exceeded'))),
        ),
        events,
      ).pipe(
        concatMap((ev) => timer(50).pipe(map(() => ev))),
        sequentializeListenerEvents({resolveChainDeadline: 200}),
        toArray(),
      ),
    ),
  ).rejects.toThrow(DeadlineExceededError)

  // Make sure the error is thrown within 50ms of when the first gap is detected and `resolveChainDeadline` ms
  // has passed without chain resolution
  // the first gap is emitted by the third event and there's 50ms between each event emitting
  // so with a deadline of 200, the DeadlineExceededError should be thrown around the 350ms mark.
  expect(350 - new Date().getTime() - start.getTime()).toBeLessThan(50)
})

function snapshot(revision: string | null): InitialSnapshotEvent {
  return {
    type: 'snapshot',
    documentId: 'test',
    document:
      revision === null
        ? null
        : {
            _id: 'test',
            _type: 'test',
            _rev: revision,
            _createdAt: '2024-10-02T06:40:16.414Z',
            _updatedAt: '2024-10-02T06:40:16.414Z',
          },
  }
}

/**
 * Each event as `snapshot <revision>`, `<previousRev> -> <resultRev>` or its type
 */
function summarize(events: ListenerEvent[]) {
  return events.map((event) => {
    if (event.type === 'snapshot') {
      return `snapshot ${event.document?._rev ?? 'of missing document'}`
    }
    if (event.type === 'mutation') {
      return `${event.previousRev ?? 'create'} -> ${event.resultRev}`
    }
    return event.type
  })
}

function sequence(options?: {maxBufferSize?: number; resolveChainDeadline?: number}) {
  const input = new Subject<ListenerEvent>()
  const emitted: ListenerEvent[] = []
  const errors: unknown[] = []
  const subscription = input.pipe(sequentializeListenerEvents(options)).subscribe({
    next: (event) => emitted.push(event),
    error: (error) => errors.push(error),
  })
  onTestFinished(() => subscription.unsubscribe())
  return {push: (event: ListenerEvent) => input.next(event), emitted, errors}
}

describe('putting events in sequence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('from a snapshot', () => {
    test('emits the snapshot, then each mutation as soon as it continues from the revision reached', () => {
      const {push, emitted} = sequence()

      push(snapshot('r1'))
      expect(summarize(emitted)).toEqual(['snapshot r1'])
      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))
      expect(summarize(emitted)).toEqual(['snapshot r1', 'r1 -> r2'])
      push(mutationEvent({previousRev: 'r2', resultRev: 'r3'}))
      expect(summarize(emitted)).toEqual(['snapshot r1', 'r1 -> r2', 'r2 -> r3'])
    })

    test('continues from a snapshot of a missing document with the mutation that creates it', () => {
      const {push, emitted, errors} = sequence()

      push(snapshot(null))
      push(creationEvent({resultRev: 'r1'}))
      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))

      expect(summarize(emitted)).toEqual([
        'snapshot of missing document',
        'create -> r1',
        'r1 -> r2',
      ])
      expect(errors).toEqual([])
    })

    test('continues after the mutation that deletes the document with the one that creates it again', () => {
      const {push, emitted, errors} = sequence()

      push(snapshot('r1'))
      // the `resultRev` of a deletion is the id of its transaction, the document has no revision
      push(mutationEvent({previousRev: 'r1', resultRev: 'deleted', transition: 'disappear'}))
      push(creationEvent({resultRev: 'r2'}))

      expect(summarize(emitted)).toEqual(['snapshot r1', 'r1 -> deleted', 'create -> r2'])
      expect(errors).toEqual([])
    })

    test('starts over from a new snapshot, dropping the mutations it held back', () => {
      const {push, emitted, errors} = sequence({resolveChainDeadline: 1_000})

      push(snapshot('r1'))
      push(mutationEvent({previousRev: 'r5', resultRev: 'r6'}))
      push(snapshot('r3'))
      push(mutationEvent({previousRev: 'r3', resultRev: 'r4'}))
      push(mutationEvent({previousRev: 'r4', resultRev: 'r5'}))
      vi.advanceTimersByTime(1_000)

      // r5 -> r6 would follow r4 -> r5 if it had not been dropped with the first snapshot
      expect(summarize(emitted)).toEqual(['snapshot r1', 'snapshot r3', 'r3 -> r4', 'r4 -> r5'])
      expect(errors).toEqual([])
    })

    test('passes on other events as they are, before and after the snapshot', () => {
      const {push, emitted} = sequence()
      const reconnect: ListenerEvent = {type: 'reconnect'}
      const welcome: ListenerEvent = {type: 'welcome', listenerName: 'test'}
      const pendingBegin: ListenerEvent = {type: 'pending', phase: 'begin'}
      const pendingEnd: ListenerEvent = {type: 'pending', phase: 'end'}
      const first = snapshot('r1')
      const mutation = mutationEvent({previousRev: 'r1', resultRev: 'r2'})

      for (const event of [reconnect, welcome, first, pendingBegin, mutation, pendingEnd]) {
        push(event)
      }

      expect(emitted).toEqual([reconnect, welcome, first, pendingBegin, mutation, pendingEnd])
    })

    test('throws an error that is not an OutOfSyncError for a mutation before the first snapshot', () => {
      const {push, errors} = sequence()

      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))

      expect(errors).toEqual([new Error('Invalid state. Cannot create a sequence without a base')])
      expect(errors[0]).not.toBeInstanceOf(OutOfSyncError)
    })
  })

  describe('mutations that do not continue from the revision reached', () => {
    test('holds them back until the mutations they continue from arrive, then emits them in order', () => {
      const {push, emitted} = sequence()

      push(snapshot('r1'))
      push(mutationEvent({previousRev: 'r3', resultRev: 'r4'}))
      push(mutationEvent({previousRev: 'r2', resultRev: 'r3'}))
      expect(summarize(emitted)).toEqual(['snapshot r1'])

      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))
      expect(summarize(emitted)).toEqual(['snapshot r1', 'r1 -> r2', 'r2 -> r3', 'r3 -> r4'])
    })

    test('drops a mutation that the snapshot already includes, without holding it back', () => {
      const {push, emitted, errors} = sequence({resolveChainDeadline: 1_000})

      push(snapshot('r2'))
      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))
      vi.advanceTimersByTime(1_000)
      push(mutationEvent({previousRev: 'r2', resultRev: 'r3'}))

      expect(summarize(emitted)).toEqual(['snapshot r2', 'r2 -> r3'])
      expect(errors).toEqual([])
    })

    test('drops a mutation that is delivered again after it was emitted', () => {
      const {push, emitted, errors} = sequence({resolveChainDeadline: 1_000})

      push(snapshot('r1'))
      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))
      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))
      vi.advanceTimersByTime(1_000)

      expect(summarize(emitted)).toEqual(['snapshot r1', 'r1 -> r2'])
      expect(errors).toEqual([])
    })
  })

  describe('giving up on mutations that do not chain', () => {
    test('throws a MaxBufferExceededError once maxBufferSize mutations are held back', () => {
      const {push, errors} = sequence({maxBufferSize: 3})

      push(snapshot('r1'))
      // mutations that continue from the revision reached are never held back
      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))
      push(mutationEvent({previousRev: 'r3', resultRev: 'r4'}))
      push(mutationEvent({previousRev: 'r4', resultRev: 'r5'}))
      expect(errors).toEqual([])

      push(mutationEvent({previousRev: 'r5', resultRev: 'r6'}))
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBeInstanceOf(MaxBufferExceededError)
      expect(errors[0]).toBeInstanceOf(OutOfSyncError)
      expect(errors[0]).toMatchObject({
        name: 'MaxBufferExceededError',
        state: {base: {revision: 'r2'}},
      })
    })

    test('throws a DeadlineExceededError when held back mutations do not chain within resolveChainDeadline', () => {
      const {push, errors} = sequence({resolveChainDeadline: 1_000})

      push(snapshot('r1'))
      const heldBack = mutationEvent({previousRev: 'r2', resultRev: 'r3'})
      push(heldBack)
      vi.advanceTimersByTime(999)
      expect(errors).toEqual([])

      vi.advanceTimersByTime(1)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBeInstanceOf(DeadlineExceededError)
      expect(errors[0]).toBeInstanceOf(OutOfSyncError)
      expect(errors[0]).toMatchObject({
        name: 'DeadlineExceededError',
        state: {base: {revision: 'r1'}, buffer: [heldBack]},
      })
    })

    test('counts the deadline from the oldest mutation held back', () => {
      const {push, errors} = sequence({resolveChainDeadline: 1_000})

      push(snapshot('r1'))
      push(mutationEvent({previousRev: 'r2', resultRev: 'r3'}))
      vi.advanceTimersByTime(600)
      push(mutationEvent({previousRev: 'r4', resultRev: 'r5'}))
      push({type: 'reconnect'})
      vi.advanceTimersByTime(399)
      expect(errors).toEqual([])

      vi.advanceTimersByTime(1)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBeInstanceOf(DeadlineExceededError)
    })

    test('stops the deadline once the held back mutations chain', () => {
      const {push, emitted, errors} = sequence({resolveChainDeadline: 1_000})

      push(snapshot('r1'))
      push(mutationEvent({previousRev: 'r2', resultRev: 'r3'}))
      vi.advanceTimersByTime(500)
      push(mutationEvent({previousRev: 'r1', resultRev: 'r2'}))
      vi.advanceTimersByTime(10_000)
      push(mutationEvent({previousRev: 'r3', resultRev: 'r4'}))

      expect(summarize(emitted)).toEqual(['snapshot r1', 'r1 -> r2', 'r2 -> r3', 'r3 -> r4'])
      expect(errors).toEqual([])
    })

    test('by default, gives up once 20 mutations are held back', () => {
      const {push, errors} = sequence()

      push(snapshot('r1'))
      for (let i = 1; i < 20; i++) {
        push(mutationEvent({previousRev: `unknown-${i}`, resultRev: `unknown-${i}-next`}))
      }
      expect(errors).toEqual([])

      push(mutationEvent({previousRev: 'unknown-20', resultRev: 'unknown-20-next'}))
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBeInstanceOf(MaxBufferExceededError)
    })

    test('by default, waits 30 seconds for held back mutations to chain', () => {
      const {push, errors} = sequence()

      push(snapshot('r1'))
      push(mutationEvent({previousRev: 'r2', resultRev: 'r3'}))
      vi.advanceTimersByTime(29_999)
      expect(errors).toEqual([])

      vi.advanceTimersByTime(1)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBeInstanceOf(DeadlineExceededError)
    })
  })
})
