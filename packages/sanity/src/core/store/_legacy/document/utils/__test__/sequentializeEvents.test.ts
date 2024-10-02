/* eslint-disable no-nested-ternary */
import {expect, test} from '@jest/globals'
import {from, lastValueFrom} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {type MutationPayload} from '../buffered-doc'
import {type ListenerEvent} from '../getPairListener'
import {sequentializeListenerEvents} from '../sequentializeListenerEvents'
import {type MutationEvent} from '../types'

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

test("it accumulates events that doesn't apply in a chain starting at the current revision", async () => {
  const events = from([
    {
      type: 'snapshot',
      documentId: 'test',
      initialRevision: 'one',
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
            ? event.initialRevision
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
