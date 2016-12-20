// @flow
import {test} from 'tap'

import BufferedDocumentTester from './util/BufferedDocumentTester'

test('simple edit cycle', tap => {
  (new BufferedDocumentTester(tap, {
    _id: 'a',
    _rev: '1',
    title: 'Hello'
  }))
  .hasNoLocalEdits()

  .stage('when applying first local edit')
  .localPatch({
    id: 'a',
    set: {
      'title': 'Good bye'
    }
  })
  .onMutationFired()
  .hasLocalEdits()

  .stage('when applying second local edit')
  .localPatch({
    id: 'a',
    set: {
      'body': 'My friend'
    }
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

test('simple edit cycle with remote edits', tap => {
  (new BufferedDocumentTester(tap, {
    _id: 'a',
    _rev: '1',
    numbers: [0]
  }))
  .hasNoLocalEdits()

  .stage('when applying first local edit')
  .localPatch({
    id: 'a',
    insert: {
      after: 'numbers[-1]',
      items: [1]
    }
  })
  .onMutationFired()
  .hasLocalEdits()
  .assertLOCAL('numbers', [0, 1])

  .stage('when remote patch appear')
  .remotePatch('1', '2', {
    id: 'a',
    insert: {
      before: 'numbers[0]',
      items: [-1]
    }
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

test('document being deleted by remote', tap => {
  (new BufferedDocumentTester(tap, {
    _id: 'a',
    _rev: '1',
    text: 'hello'
  }))
  .hasNoLocalEdits()

  .stage('when applying first local edit')
  .localPatch({
    id: 'a',
    set: {
      text: 'goodbye'
    }
  })
  .onMutationFired()
  .hasLocalEdits()
  .assertLOCAL('text', 'goodbye')

  .stage('when remote delete patch appear')
  .remoteMutation('1', '2', {
    delete: {id: 'a'}
  })
  .didRebase()
  .onDeleteDidFire()
  .hasNoLocalEdits()
  .assertALLDeleted()

  .stage('when local user creates document')
  .localMutation(null, '3', {
    create: {_id: 'a', text: 'good morning'}
  })
  .assertLOCAL('text', 'good morning')
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
