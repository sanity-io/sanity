import {afterEach, expect, test, vi} from 'vitest'

import {BufferedDocument, Mutation} from '../src/document'
import {type CommitHandlerMessage} from '../src/document/BufferedDocument'
import {BufferedDocumentTester} from './util/BufferedDocumentTester'

afterEach(() => {
  vi.useRealTimers()
})

/** A buffered document whose commit requests are collected instead of sent. */
function lostResponseDocument() {
  const doc = new BufferedDocument({_id: 'a', _type: 't', _rev: '1', title: 'Hello'})
  const sent: CommitHandlerMessage[] = []
  doc.commitHandler = (msg) => sent.push(msg)
  return {doc, sent}
}

const setTitle = (title: string) => new Mutation({mutations: [{patch: {id: 'a', set: {title}}}]})

/** The listener's echo of a commit request that landed on `previousRev`. */
const echoOf = ({mutation}: CommitHandlerMessage, previousRev: string) =>
  new Mutation({
    transactionId: mutation.transactionId,
    resultRev: mutation.transactionId,
    previousRev,
    mutations: mutation.mutations,
  })

const remoteSet = (transactionId: string, previousRev: string, set: Record<string, unknown>) =>
  new Mutation({
    transactionId,
    resultRev: transactionId,
    previousRev,
    mutations: [{patch: {id: 'a', set}}],
  })

test('simple edit cycle', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    title: 'Hello',
  })
    .hasNoLocalEdits()
    .stage('when applying first local edit')
    .localPatch({
      id: 'a',
      set: {
        title: 'Good bye',
      },
    })
    .onMutationFired()
    .hasLocalEdits()
    .stage('when applying second local edit')
    .localPatch({
      id: 'a',
      set: {
        body: 'My friend',
      },
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('title', 'Good bye')
    .assertEDGE('title', 'Hello')
    .stage('when committing local edits')
    .commit()
    .onMutationDidNotFire()
    .hasPendingCommit()
    .hasNoLocalEdits()
    .assertHEAD('title', 'Hello')
    .assertEDGE('title', 'Good bye')
    .assertLOCAL('title', 'Good bye')
    .stage('when commit suceeds')
    .commitSucceeds()
    .onMutationDidNotFire()
    .assertALL('title', 'Good bye')
    .assertALL('body', 'My friend')
    .isConsistent()
})

test('simple remote edit', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    numbers: [0],
  })
    .hasNoLocalEdits()
    .stage('when remote patch appear')
    .remotePatch('1', '2', {
      id: 'a',
      insert: {
        before: 'numbers[0]',
        items: [-1],
      },
    })
    .onMutationFired()
    .didNotRebase()
    .hasNoLocalEdits()
    .assertLOCAL('numbers', [-1, 0])
    .assertEDGE('numbers', [-1, 0])
    .isConsistent()
})

test('simple edit cycle with remote edits causing rebase', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    numbers: [0],
  })
    .hasNoLocalEdits()
    .stage('when applying first local edit')
    .localPatch({
      id: 'a',
      insert: {
        after: 'numbers[-1]',
        items: [1],
      },
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('numbers', [0, 1])
    .stage('when remote patch appear')
    .remotePatch('1', '2', {
      id: 'a',
      insert: {
        before: 'numbers[0]',
        items: [-1],
      },
    })
    .didRebase()
    .hasLocalEdits()
    .assertLOCAL('numbers', [-1, 0, 1])
    .assertEDGE('numbers', [-1, 0])
    .stage('when committing local edits')
    .commit()
    .onMutationDidNotFire()
    .didNotRebase()
    .assertLOCAL('numbers', [-1, 0, 1])
    .assertEDGE('numbers', [-1, 0, 1])
    .assertHEAD('numbers', [-1, 0])
    .stage('when commit suceeds')
    .commitSucceeds()
    .onMutationDidNotFire()
    .assertALL('numbers', [-1, 0, 1])
    .isConsistent()
})

test('document being deleted by remote', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .stage('when applying first local edit')
    .localPatch({
      id: 'a',
      set: {
        text: 'goodbye',
      },
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('text', 'goodbye')
    .stage('when remote delete patch appear')
    .remoteMutation('1', '2', {
      delete: {id: 'a'},
    })
    .didRebase()
    .onDeleteDidFire()
    .hasNoLocalEdits()
    .assertALLDeleted()
    .stage('when local user creates document')
    .localMutation(undefined, '3', {
      create: {_id: 'a', _type: 't', text: 'good morning', _createdAt: '2018-01-25T15:18:12.114Z'},
    })
    .assert((bufDoc) => {
      expect(typeof bufDoc?.LOCAL?._createdAt).toBe('string') // 'New documents must have a _createdAt time'
    })
    .assertLOCAL('text', 'good morning')
    .assertLOCAL('_rev', '3')
    .assertHEADDeleted()
    .assertEDGEDeleted()
    .stage('when committing local create')
    .commit()
    .assertHEADDeleted()
    .assertEDGE('text', 'good morning')
    .stage('when commit succeeds')
    .commitSucceeds()
    .assertALL('text', 'good morning')
})

test('document being created with `createOrReplace`', () => {
  const createdAt = '2018-01-25T15:18:12.114Z'
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .stage('when applying createOrReplace mutation')
    .localMutation(undefined, '2', {
      createOrReplace: {_id: 'a', _type: 't', text: 'good morning', _createdAt: createdAt},
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('_createdAt', createdAt)
    .assertLOCAL('_rev', '2')
})

test('document being created with `createIfNotExists`', () => {
  const createdAt = '2018-01-25T15:18:12.114Z'
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .localMutation('1', '2', {
      delete: {id: 'a'},
    })
    .stage('when applying createIfNotExists mutation')
    .localMutation(undefined, '3', {
      createIfNotExists: {_id: 'a', _type: 't', text: 'good morning', _createdAt: createdAt},
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('_rev', '3')
    .assertLOCAL('_createdAt', createdAt)
})

test('document being created with `create`', () => {
  const createdAt = '2018-01-25T15:18:12.114Z'
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .localMutation('1', '2', {
      delete: {id: 'a'},
    })
    .stage('when applying create mutation')
    .localMutation(undefined, '2', {
      create: {_id: 'a', _type: 't', text: 'good morning', _createdAt: createdAt},
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('_createdAt', createdAt)
})

test('document being deleted by local', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .stage('when local deletes document')
    .localMutation('1', '2', {
      delete: {id: 'a'},
    })
    .onMutationFired()
    .onDeleteDidFire()
    .hasLocalEdits()
    .stage('when local commits delete')
    .commit()
    .onMutationDidNotFire()
    .stage('when local delete commits succeed, but the txn arrives before commit completes')
    .commitSucceedsButMutationArriveDuringCommitProcess()
    .onMutationDidNotFire()
    .assertALLDeleted()
})

test('no-op-patch only changes _rev of target document', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .stage('when local fires a no-op patch')
    .localMutation('1', '2', {
      patch: {
        id: 'a',
        unset: ['nonExistent'],
      },
    })
    .assertLOCAL('_rev', '2')
    .assertEDGE('_rev', '1')
    .assertHEAD('_rev', '1')
    .onMutationFired()
    .hasLocalEdits()
    .stage('when no-op patch commits')
    .commit()
})

test('remotely created documents has _rev', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
  })
    .remoteMutation('1', '2', {
      delete: {id: 'a'},
    })
    .remoteMutation(undefined, '2', {
      create: {
        _id: 'a',
        _type: 't',
      },
    })
    .assertHEAD('_rev', '2')
})

test('remote patch touching an out-of-range index arrives while local edits are pending', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    body: [{_key: 'a', _type: 'block', children: [{_key: 'a1', _type: 'span', text: 'hello'}]}],
  })
    .stage('when applying local edit')
    .localPatch({
      id: 'a',
      set: {'body[0].children[0].text': 'hello world'},
    })
    .hasLocalEdits()
    .stage('when remote patch touching an out-of-range index arrives')
    .remotePatch('1', '2', {
      id: 'a',
      set: {'body[4].children[0].text': 'x'},
    })
    .assertLOCAL('body[0].children[0].text', 'hello world')
    .assertHEAD('_rev', '2')
    .stage('when the next remote patch arrives')
    .remotePatch('2', '3', {
      id: 'a',
      set: {title: 'still alive'},
    })
    .assertHEAD('title', 'still alive')
    .assertLOCAL('title', 'still alive')
    .assertLOCAL('body[0].children[0].text', 'hello world')
})

test('pending local patch on an array index removed by a remote patch rebases cleanly', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    items: [{title: 'one'}, {title: 'two'}, {title: 'three'}],
  })
    .stage('when applying local edit to the third item')
    .localPatch({
      id: 'a',
      set: {'items[2].title': 'three edited'},
    })
    .hasLocalEdits()
    .assertLOCAL('items[2].title', 'three edited')
    .stage('when a remote patch removes the last two items')
    .remotePatch('1', '2', {
      id: 'a',
      unset: ['items[1:3]'],
    })
    .didRebase()
    .assertLOCAL('items', [{title: 'one'}])
})

test('a commit whose echo arrives during its retry backoff is not applied again locally', async () => {
  // The commit lands but its response is lost, so it waits to be retried. Its echo then arrives,
  // and the user keeps typing. The retry reuses the transaction id and is answered as already
  // existing, which the commit handler reports as success.
  vi.useFakeTimers()
  const {doc, sent} = lostResponseDocument()
  doc.add(setTitle('Hello world'))
  const committed = doc.commit()
  sent[0]!.failure()
  doc.arrive(echoOf(sent[0]!, '1'))

  expect(doc.LOCAL).toMatchObject({title: 'Hello world'})

  doc.add(setTitle('Hello world!'))
  void doc.commit()
  vi.advanceTimersByTime(1000)
  expect(sent[1]!.mutation.transactionId).toBe(sent[0]!.mutation.transactionId)
  sent[1]!.success()
  await committed

  // The user's next edit goes out against the server's copy, which has " world" once.
  const next = sent[2]!.mutation
  expect(
    next.apply({_id: 'a', _type: 't', _rev: sent[0]!.mutation.transactionId, title: 'Hello world'}),
  ).toMatchObject({
    title: 'Hello world!',
  })
  expect(doc.LOCAL).toMatchObject({title: 'Hello world!'})
})

test('a commit whose echo arrived while it was in flight is not applied again while retried', async () => {
  // The echo arrives before the request fails, then another user edits during the backoff and
  // again while the retry is in flight.
  vi.useFakeTimers()
  const {doc, sent} = lostResponseDocument()
  doc.add(setTitle('Hello world'))
  const committed = doc.commit()
  const transactionId = sent[0]!.mutation.transactionId!
  doc.arrive(echoOf(sent[0]!, '1'))
  sent[0]!.failure()
  doc.arrive(remoteSet('b1', transactionId, {subtitle: 'B'}))

  expect(doc.LOCAL).toMatchObject({title: 'Hello world', subtitle: 'B'})

  vi.advanceTimersByTime(1000)
  doc.arrive(remoteSet('b2', 'b1', {subtitle: 'BB'}))
  expect(doc.LOCAL).toMatchObject({title: 'Hello world', subtitle: 'BB'})

  sent[1]!.success()
  await committed
  expect(doc.document.isConsistent()).toBe(true)
  expect(doc.LOCAL).toMatchObject({title: 'Hello world', subtitle: 'BB'})
})
