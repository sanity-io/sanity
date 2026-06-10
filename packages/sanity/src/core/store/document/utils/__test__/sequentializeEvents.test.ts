import {from, lastValueFrom, map, merge, throwError, timer} from 'rxjs'
import {concatMap, mergeMap, toArray} from 'rxjs/operators'
import {expect, test} from 'vitest'

import {type MutationPayload} from '../../buffered-doc'
import {type ListenerEvent} from '../../getPairListener'
import {type MutationEvent} from '../../types'
import {
  DeadlineExceededError,
  MaxBufferExceededError,
  sequentializeListenerEvents,
} from '../sequentializeListenerEvents'

function mutationEvent({
  previousRev,
  resultRev,
  mutations,
  messageReceivedAt,
}: {
  previousRev: string
  resultRev: string
  mutations: MutationPayload[]
  messageReceivedAt: string
}): MutationEvent {
  return {
    type: 'mutation',
    documentId: 'test',
    transactionId: resultRev,
    effects: {revert: [], apply: []},
    mutations,
    previousRev: previousRev,
    resultRev: resultRev,
    transition: 'update',
    transactionCurrentEvent: 1,
    transactionTotalEvents: 1,
    visibility: 'transaction',
    messageReceivedAt,
  }
}

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
  ).rejects.toThrowError(MaxBufferExceededError)
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
  ).rejects.toThrowError(DeadlineExceededError)
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
  ).rejects.toThrowError(DeadlineExceededError)

  // Make sure the error is thrown within 50ms of when the first gap is detected and `resolveChainDeadline` ms
  // has passed without chain resolution
  // the first gap is emitted by the third event and there's 50ms between each event emitting
  // so with a deadline of 200, the DeadlineExceededError should be thrown around the 350ms mark.
  expect(350 - new Date().getTime() - start.getTime()).toBeLessThan(50)
})
