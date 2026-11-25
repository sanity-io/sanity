import {type SanityDocument} from '@sanity/types'
import {Subject} from 'rxjs'
import {afterEach, expect, test} from 'vitest'

import {type ListenerEvent} from '../getPairListener'
import {mutationEvent} from '../utils/__test__/test-utils'
import {
  type CommitRequest,
  createObservableBufferedDocument,
} from './createObservableBufferedDocument'

const INITIAL: SanityDocument = {
  _id: 'drafts.doc-1',
  _rev: 'r0',
  _type: 'news',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  body: [{_key: 'a', _type: 'block', children: [{_key: 'a1', _type: 'span', text: 'hello'}]}],
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
    mutationEvent({
      documentId: 'drafts.doc-1',
      previousRev: 'r0',
      resultRev: 'r1',
      mutations: [{patch: {id: 'drafts.doc-1', set: {'body[4].children[0].text': 'x'}}}],
    }),
  )

  expect(streamError).toBeNull()

  // the unapplicable sub-patch was dropped, the local edit is intact
  const afterPoison = snapshots.at(-1)
  expect(afterPoison?.body).toMatchObject([
    {_key: 'a', children: [{_key: 'a1', text: 'hello world'}]},
  ])

  // subsequent remote mutations still come through
  listenerEvent$.next(
    mutationEvent({
      documentId: 'drafts.doc-1',
      previousRev: 'r1',
      resultRev: 'r2',
      mutations: [{patch: {id: 'drafts.doc-1', set: {title: 'still alive'}}}],
    }),
  )

  const afterHealthy = snapshots.at(-1)
  expect(streamError).toBeNull()
  expect(afterHealthy?.title).toBe('still alive')
  expect(afterHealthy?._rev).toBe('r2')
  expect(afterHealthy?.body).toMatchObject([
    {_key: 'a', children: [{_key: 'a1', text: 'hello world'}]},
  ])
})

const unhandled: unknown[] = []
const onUnhandled = (reason: unknown) => unhandled.push(reason)
afterEach(() => {
  process.off('unhandledRejection', onUnhandled)
  unhandled.length = 0
})

test('commits cancelled by a terminal error leave no unhandled rejections', async () => {
  process.on('unhandledRejection', onUnhandled)
  const listenerEvent$ = new Subject<ListenerEvent>()
  const buffered = createObservableBufferedDocument(listenerEvent$)
  const requests: CommitRequest[] = []
  buffered.commitRequest$.subscribe((request) => requests.push(request))
  buffered.updates$.subscribe()
  listenerEvent$.next({type: 'snapshot', documentId: 'drafts.doc-1', document: INITIAL})

  // The first commit is in flight while two more queue behind it.
  for (const text of ['a', 'b', 'c']) {
    buffered.addMutation({patch: {id: 'drafts.doc-1', set: {title: text}}})
    buffered.commit()
  }
  expect(requests).toHaveLength(1)

  // A terminal error (a 422, say) cancels the in-flight commit, which rejects every queued one.
  requests[0]!.cancel(new Error('injected 422'))
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect(unhandled).toEqual([])
})
