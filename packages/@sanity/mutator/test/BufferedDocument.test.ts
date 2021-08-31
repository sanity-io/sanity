import BufferedDocumentTester from './util/BufferedDocumentTester'

test('simple edit cycle', () => {
  new BufferedDocumentTester({
    _id: 'a',
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
    .end()
})

test('simple remote edit', () => {
  new BufferedDocumentTester({
    _id: 'a',
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
    .end()
})

test('simple edit cycle with remote edits causing rebase', () => {
  new BufferedDocumentTester({
    _id: 'a',
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
    .end()
})

test('document being deleted by remote', () => {
  new BufferedDocumentTester({
    _id: 'a',
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
    .localMutation(null, '3', {
      create: {_id: 'a', text: 'good morning', _createdAt: '2018-01-25T15:18:12.114Z'},
    })
    .assert((bufDoc) => {
      expect(typeof bufDoc.LOCAL._createdAt).toBe('string') // 'New documents must have a _createdAt time'
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
    .end()
})

test('document being created with `createOrReplace`', () => {
  const createdAt = '2018-01-25T15:18:12.114Z'
  new BufferedDocumentTester({
    _id: 'a',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .stage('when applying createOrReplace mutation')
    .localMutation(null, '2', {
      createOrReplace: {_id: 'a', text: 'good morning', _createdAt: createdAt},
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('_createdAt', createdAt)
    .assertLOCAL('_rev', '2')
    .end()
})

test('document being created with `createIfNotExists`', () => {
  const createdAt = '2018-01-25T15:18:12.114Z'
  new BufferedDocumentTester({
    _id: 'a',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .localMutation('1', '2', {
      delete: {id: 'a'},
    })
    .stage('when applying createIfNotExists mutation')
    .localMutation(null, '3', {
      createIfNotExists: {_id: 'a', text: 'good morning', _createdAt: createdAt},
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('_rev', '3')
    .assertLOCAL('_createdAt', createdAt)
    .end()
})

test('document being created with `create`', () => {
  const createdAt = '2018-01-25T15:18:12.114Z'
  new BufferedDocumentTester({
    _id: 'a',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .localMutation('1', '2', {
      delete: {id: 'a'},
    })
    .stage('when applying create mutation')
    .localMutation(null, '2', {
      create: {_id: 'a', text: 'good morning', _createdAt: createdAt},
    })
    .onMutationFired()
    .hasLocalEdits()
    .assertLOCAL('_createdAt', createdAt)
    .end()
})

test('document being deleted by local', () => {
  new BufferedDocumentTester({
    _id: 'a',
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
    .end()
})

test('no-op-patch only changes _rev of target document', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _rev: '1',
    text: 'hello',
  })
    .hasNoLocalEdits()
    .stage('when local fires a no-op patch')
    .localMutation('1', '2', {
      id: 'a',
      patch: {
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
    .end()
})

test('remotely created documents has _rev', () => {
  new BufferedDocumentTester({
    _id: 'a',
    _rev: '1',
  })
    .remoteMutation('1', '2', {
      delete: {id: 'a'},
    })
    .remoteMutation(null, '2', {
      create: {
        _id: 'a',
      },
    })
    .assertHEAD('_rev', '2')
    .end()
})
