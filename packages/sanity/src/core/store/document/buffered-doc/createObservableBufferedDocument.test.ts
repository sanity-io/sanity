import {type SanityDocument} from '@sanity/types'
import {Subject} from 'rxjs'
import {expect, test} from 'vitest'

import {type ListenerEvent} from '../getPairListener'
import {type MutationEvent} from '../types'
import {createObservableBufferedDocument} from './createObservableBufferedDocument'

const INITIAL: SanityDocument = {
  _id: 'drafts.doc-1',
  _rev: 'r0',
  _type: 'news',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  body: [{_key: 'a', _type: 'block', children: [{_key: 'a1', _type: 'span', text: 'hello'}]}],
}

function mutationEvent(
  previousRev: string,
  resultRev: string,
  mutations: MutationEvent['mutations'],
): MutationEvent {
  return {
    type: 'mutation',
    documentId: 'drafts.doc-1',
    transactionId: resultRev,
    mutations,
    effects: {apply: [], revert: []},
    previousRev,
    resultRev,
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
    messageReceivedAt: new Date().toISOString(),
    visibility: 'transaction',
    transition: 'update',
  }
}

test('a remote patch that cannot apply to the local document does not error the snapshot stream', () => {
  const listenerEvent$ = new Subject<ListenerEvent>()
  const buffered = createObservableBufferedDocument(listenerEvent$)

  const snapshots: SanityDocument[] = []
  let streamError: unknown = null
  buffered.updates$.subscribe({
    next: (event) => {
      if (event.type === 'snapshot' && event.document) {
        snapshots.push(event.document)
      }
    },
    error: (err) => {
      streamError = err
    },
  })

  listenerEvent$.next({type: 'snapshot', documentId: 'drafts.doc-1', document: INITIAL})

  // unsaved local edits are sitting in the buffer
  buffered.addMutation({
    patch: {id: 'drafts.doc-1', set: {'body[0].children[0].text': 'hello world'}},
  })

  // a client whose copy of `body` is longer than ours patches the fifth block
  listenerEvent$.next(
    mutationEvent('r0', 'r1', [
      {patch: {id: 'drafts.doc-1', set: {'body[4].children[0].text': 'x'}}},
    ]),
  )

  expect(streamError).toBeNull()

  // the unapplicable sub-patch was dropped, the local edit is intact
  const afterPoison = snapshots.at(-1)
  expect(afterPoison?.body).toMatchObject([
    {_key: 'a', children: [{_key: 'a1', text: 'hello world'}]},
  ])

  // subsequent remote mutations still come through
  listenerEvent$.next(
    mutationEvent('r1', 'r2', [{patch: {id: 'drafts.doc-1', set: {title: 'still alive'}}}]),
  )

  const afterHealthy = snapshots.at(-1)
  expect(streamError).toBeNull()
  expect(afterHealthy?.title).toBe('still alive')
  expect(afterHealthy?._rev).toBe('r2')
  expect(afterHealthy?.body).toMatchObject([
    {_key: 'a', children: [{_key: 'a1', text: 'hello world'}]},
  ])
})
