import {type SanityDocument} from '@sanity/types'
import {Subject} from 'rxjs'
import {expect, test, vi} from 'vitest'

import {errorReporter} from '../../../error/errorReporter'
import {type ListenerEvent} from '../getPairListener'
import {mutationEvent} from '../utils/__test__/test-utils'
import {
  type CommitRequest,
  createObservableBufferedDocument,
  type SaveRejectedEvent,
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

test('a cancelled commit emits saveRejected$ with the discarded and the restored document', () => {
  const listenerEvent$ = new Subject<ListenerEvent>()
  const buffered = createObservableBufferedDocument(listenerEvent$)
  const commitRequests: CommitRequest[] = []
  const rejections: SaveRejectedEvent[] = []
  const subscriptions = [
    buffered.updates$.subscribe(),
    buffered.commitRequest$.subscribe((request) => commitRequests.push(request)),
    buffered.saveRejected$.subscribe((event) => rejections.push(event)),
  ]
  listenerEvent$.next({type: 'snapshot', documentId: 'drafts.doc-1', document: INITIAL})

  buffered.addMutation({patch: {id: 'drafts.doc-1', set: {title: 'sent'}}})
  buffered.commit()
  buffered.addMutation({patch: {id: 'drafts.doc-1', set: {title: 'typed during the save'}}})
  const rejection = new Error('Commit rejected with 403')
  commitRequests[0].cancel(rejection)

  expect(rejections).toEqual([
    {
      error: rejection,
      discardedDocument: expect.objectContaining({title: 'typed during the save'}),
      restoredDocument: INITIAL,
    },
  ])
  subscriptions.forEach((subscription) => subscription.unsubscribe())
})

test('a commit that fails inside the mutator, with no HTTP status, is reported as unhandled', async () => {
  const reportError = vi.spyOn(errorReporter, 'reportError').mockReturnValue(null)
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const listenerEvent$ = new Subject<ListenerEvent>()
  const buffered = createObservableBufferedDocument(listenerEvent$)
  const subscriptions = [
    buffered.updates$.subscribe({error: () => undefined}),
    buffered.commitRequest$.subscribe((request) => request.success()),
  ]
  listenerEvent$.next({
    type: 'snapshot',
    documentId: 'drafts.doc-1',
    document: {...INITIAL, title: 'Hello'},
  })

  buffered.addMutation({
    patch: {id: 'drafts.doc-1', diffMatchPatch: {title: '@@ -1,5 +1,6 @@\n Hello\n+!\n'}},
  })
  try {
    listenerEvent$.next(
      mutationEvent({
        documentId: 'drafts.doc-1',
        previousRev: 'r0',
        resultRev: 'r1',
        mutations: [{patch: {id: 'drafts.doc-1', unset: ['title']}}],
      }),
    )
  } catch {
    // The remote unset under a buffered string edit throws from `arrive` (known bug K2)
  }
  buffered.commit()
  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(reportError).toHaveBeenCalledWith(expect.any(Error), {handled: false})
  subscriptions.forEach((subscription) => subscription.unsubscribe())
  reportError.mockRestore()
  consoleError.mockRestore()
})
