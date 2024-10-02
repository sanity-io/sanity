/* eslint-disable no-nested-ternary */
import {expect, it, test} from '@jest/globals'
import {from, lastValueFrom} from 'rxjs'
import {toArray} from 'rxjs/operators'

import {type ListenerEvent} from '../../getPairListener'
import {discardInitialMutationEvents} from '../discardInitialEvents'
import {mutationEvent} from './test-utils'

it('it disregards a chain of mutation events that leads up to the initial revision', async () => {
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
    (await lastValueFrom(events.pipe(discardInitialMutationEvents(), toArray()))).map((event) => {
      return event?.type === 'mutation' ? event.mutations : event?.type
    }),
  ).toEqual(['snapshot', [{patch: {set: {name: 'SHOULD BE APPLIED'}}}]])
})

test('it handles an initial missing document', async () => {
  const events = from([
    {
      type: 'snapshot',
      documentId: 'test',
      initialRevision: undefined,
      document: null,
    },
    // this has the snapshot revision as it's previous and should be applied
    mutationEvent({
      previousRev: 'one',
      resultRev: 'two',
      mutations: [{patch: {set: {name: 'SHOULD BE APPLIED'}}}],
    }),
  ] satisfies ListenerEvent[])

  expect(
    (await lastValueFrom(events.pipe(discardInitialMutationEvents(), toArray()))).map((event) => {
      return event?.type === 'mutation' ? event.mutations : event?.type
    }),
  ).toEqual(['snapshot', [{patch: {set: {name: 'SHOULD BE APPLIED'}}}]])
})
