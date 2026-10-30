import {expect, test, vi} from 'vitest'

import {BufferedDocument, Mutation} from '../src/document'
import {type CommitHandlerMessage} from '../src/document/BufferedDocument'
import {type Doc} from '../src/document/types'
import {BufferedDocumentTester} from './util/BufferedDocumentTester'

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

test('local edits made while a commit is in flight survive the commit being cancelled', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    title: 'Hello',
  })
    .stage('when committing a local edit')
    .localPatch({
      id: 'a',
      set: {title: 'Good bye'},
    })
    .commit()
    .hasPendingCommit()
    .stage('when applying a local edit while the commit is in flight')
    .localPatch({
      id: 'a',
      set: {body: 'My friend'},
    })
    .hasLocalEdits()
    .stage('when the commit is cancelled')
    .commitCancelled()
    .didRebase()
    .hasNoPendingCommit()
    .hasLocalEdits()
    .assertHEAD('title', 'Hello')
    .assertLOCAL('title', 'Hello')
    .assertLOCAL('body', 'My friend')
    .stage('when committing the remaining local edits')
    .commit()
    .hasPendingCommit()
    .hasNoLocalEdits()
    .assertEDGE('title', 'Hello')
    .assertEDGE('body', 'My friend')
    .stage('when commit succeeds')
    .commitSucceeds()
    .assertALL('title', 'Hello')
    .assertALL('body', 'My friend')
    .isConsistent()
})

function createObservedDocument() {
  const doc = new BufferedDocument({_id: 'a', _type: 't', _rev: '1', title: 'Hello'})
  const consistencyEvents: boolean[] = []
  doc.onConsistencyChanged = (isConsistent) => consistencyEvents.push(isConsistent)
  return {doc, consistencyEvents}
}

function setTitle(title: string) {
  return new Mutation({mutations: [{patch: {id: 'a', set: {title}}}]})
}

test('committing a local edit with no net change reports the document consistent again', async () => {
  const {doc, consistencyEvents} = createObservedDocument()
  doc.commitHandler = () => {
    throw new Error('Nothing should be sent for an edit with no net change')
  }

  doc.add(setTitle('Hello'))
  expect(consistencyEvents).toEqual([false])

  await doc.commit()
  expect(consistencyEvents).toEqual([false, true])
})

test('committing nothing while a failed commit waits to retry keeps the document inconsistent', async () => {
  vi.useFakeTimers()
  try {
    const {doc, consistencyEvents} = createObservedDocument()
    let failCommit: (() => void) | undefined
    doc.commitHandler = (message) => {
      failCommit = message.failure
    }

    doc.add(setTitle('Good bye'))
    void doc.commit()
    failCommit?.()
    doc.add(setTitle('Good bye'))
    await doc.commit()

    expect(consistencyEvents).not.toContain(true)
  } finally {
    vi.useRealTimers()
  }
})

test('a buffered string edit survives a remote unset of the same field', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _type: 't',
    _rev: '1',
    title: 'Hello',
  })
    .stage('when applying a local string edit')
    .localPatch({id: 'a', set: {title: 'Good bye'}})
    .hasLocalEdits()
    .stage('when a remote patch unsets the field')
    .remotePatch('1', '2', {id: 'a', unset: ['title']})
    .assertHEAD('title', undefined)
    .assertLOCAL('title', 'Good bye')
    .stage('when committing local edits')
    .commit()
    .hasPendingCommit()
    .assertEDGE('title', 'Good bye')
    .stage('when commit succeeds')
    .commitSucceeds()
    .assertALL('title', 'Good bye')
    .isConsistent()
})

function absorbErrors(action: () => void): void {
  try {
    action()
  } catch (error) {
    return
  }
}

test('a commit that cannot be staged is rejected and later commits still reach the commit handler', async () => {
  const doc = new BufferedDocument({_id: 'a', _type: 't', _rev: '1', title: 'Hello'})
  const committed: CommitHandlerMessage[] = []
  doc.commitHandler = (message) => committed.push(message)
  doc.add(
    new Mutation({
      mutations: [{patch: {id: 'a', diffMatchPatch: {title: '@@ -1,5 +1,6 @@\n Hello\n+!\n'}}}],
    }),
  )
  const unsetTitle = new Mutation({
    transactionId: '2',
    resultRev: '2',
    previousRev: '1',
    mutations: [{patch: {id: 'a', unset: ['title']}}],
  })
  absorbErrors(() => doc.arrive(unsetTitle))

  await expect(doc.commit()).rejects.toThrow('Unable to apply diffMatchPatch to target title')
  expect(doc.committerRunning).toBe(false)

  doc.add(new Mutation({mutations: [{patch: {id: 'a', set: {body: 'My friend'}}}]}))
  void doc.commit()
  expect(committed.map(({mutation}) => mutation.mutations)).toEqual([
    [{patch: {id: 'a', set: {body: 'My friend'}}}],
  ])
})

const PUBLISHED = {
  _id: 'drafts.a',
  _type: 't',
  _createdAt: '2025-01-01T00:00:00.000Z',
  title: 'Published',
}

function createDraftFromPublished() {
  const rebases: Array<Doc | null> = []
  const commits: CommitHandlerMessage[] = []
  const document = new BufferedDocument(null)
  document.onRebase = (localDocument) => rebases.push(localDocument)
  document.commitHandler = (message) => commits.push(message)

  document.add(
    new Mutation({
      mutations: [
        {createIfNotExists: {...PUBLISHED}},
        {patch: {id: 'drafts.a', set: {title: 'Edited'}}},
      ],
    }),
  )
  void document.commit()
  const [commit] = commits
  commit.success()

  return {document, rebases, commit}
}

function echoOf(commit: CommitHandlerMessage, createdDocument: Doc): Mutation {
  return new Mutation({
    transactionId: commit.mutation.transactionId,
    resultRev: commit.mutation.transactionId,
    timestamp: '2026-01-01T00:00:00.000Z',
    mutations: [{create: createdDocument}, {patch: {id: 'drafts.a', set: {title: 'Edited'}}}],
  })
}

test('fields the server adds to our own transaction reach the local document', () => {
  const {document, rebases, commit} = createDraftFromPublished()
  document.add(new Mutation({mutations: [{patch: {id: 'drafts.a', set: {body: 'Typed'}}}]}))

  document.arrive(echoOf(commit, {...PUBLISHED, _system: {base: {id: 'a', rev: 'r1'}}}))

  expect(rebases).toHaveLength(1)
  expect(document.document.EDGE?._system).toEqual({base: {id: 'a', rev: 'r1'}})
  expect(document.LOCAL).toMatchObject({
    title: 'Edited',
    body: 'Typed',
    _system: {base: {id: 'a', rev: 'r1'}},
  })
})

test('an echo of our own transaction that matches the optimistic result does not rebase', () => {
  const {document, rebases, commit} = createDraftFromPublished()

  document.arrive(echoOf(commit, {...PUBLISHED}))

  expect(rebases).toHaveLength(0)
  expect(document.LOCAL?.title).toBe('Edited')
})
