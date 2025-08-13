import {from, lastValueFrom} from 'rxjs'
import {toArray} from 'rxjs/operators'
import {expect, test} from 'vitest'

import type {MutationPayload} from '../../buffered-doc/types'
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
}: {
  previousRev: string
  resultRev: string
  mutations: MutationPayload[]
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
  }
}

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
      mutations: [{patch: {set: {name: 'OK'}}}],
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'four',
      resultRev: 'five',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'three',
      resultRev: 'four',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // we have a complete unbroken chain when receiving this
    mutationEvent({
      previousRev: 'two',
      resultRev: 'three',
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
    }),
    // this is already applied to the snapshot emitted above and should be ignored
    mutationEvent({
      previousRev: 'zero',
      resultRev: 'one',
      mutations: [{patch: {set: {name: 'SHOULD ALSO BE IGNORED'}}}],
    }),
    // this has the snapshot revision as it's previous and should be applied
    mutationEvent({
      previousRev: 'one',
      resultRev: 'two',
      mutations: [{patch: {set: {name: 'SHOULD BE APPLIED'}}}],
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
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'four',
      resultRev: 'five',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // this breaks the chain
    mutationEvent({
      previousRev: 'six',
      resultRev: 'seven',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'three',
      resultRev: 'four',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // we have a complete unbroken chain when receiving this
    mutationEvent({
      previousRev: 'two',
      resultRev: 'three',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
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
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'four',
      resultRev: 'five',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // this breaks the chain
    mutationEvent({
      previousRev: 'six',
      resultRev: 'seven',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // this is part of an unbroken chain, but received out of order
    mutationEvent({
      previousRev: 'three',
      resultRev: 'four',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
    // we have a complete unbroken chain when receiving this
    mutationEvent({
      previousRev: 'two',
      resultRev: 'three',
      mutations: [{patch: {set: {name: 'Out of order'}}}],
    }),
  ] satisfies ListenerEvent[])

  await expect(
    lastValueFrom(events.pipe(sequentializeListenerEvents({resolveChainDeadline: 100}), toArray())),
  ).rejects.toThrowError(DeadlineExceededError)
})
