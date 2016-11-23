// @flow

// A test jig for the BufferedDocument model

import {BufferedDocument, Mutation} from '../../src/document'
import {extract} from '../../src/jsonpath'

export default class BufferedDocumentTester {
  doc : BufferedDocument
  pendingCommit : Object
  constructor(tap, attrs) {
    this.doc = new BufferedDocument(attrs)
    this.onRebaseCalled = false
    this.doc.onRebase = edge => {
      this.onRebaseCalled = true
    }
    this.doc.onMutation = (edge, mutation) => {
      this.onMutationCalled = true
    }
    this.doc.commitHandler = opts => {
      this.pendingCommit = opts
    }
    this.tap = tap
    this.pendingCommit = null
    this.context = 'initially'
  }
  reset() {
    this.onMutationCalled = false
    this.onRebaseCalled = false
  }
  stage(title) {
    this.context = title
    return this
  }
  remotePatch(fromRev, toRev, patch) {
    this.reset()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      previousRev: fromRev,
      mutations: [{patch}]
    })
    this.doc.arrive(mut)
    return this
  }
  localPatch(patch) {
    this.reset()
    const mut = new Mutation({
      mutations: [{patch}]
    })
    this.doc.add(mut)
    return this
  }
  commit() {
    this.reset()
    this.doc.commit()
    return this
  }
  commitSucceeds() {
    this.reset()
    this.pendingCommit.success()
    // Magically this commit is based on the current HEAD revision
    this.pendingCommit.mutation.params.previousRev = this.doc.document.HEAD._rev
    this.doc.arrive(this.pendingCommit.mutation)
    this.pendingCommit = null
    return this
  }
  commitFails() {
    this.reset()
    this.pendingCommit.failure()
    this.pendingCommit = null
    return this
  }
  assertLOCAL(path, value) {
    this.tap.same(extract(path, this.doc.LOCAL)[0], value, `assert value ${path} of LOCAL failed ${this.context}`)
    return this
  }
  assertEDGE(path, value) {
    this.tap.same(extract(path, this.doc.document.EDGE)[0], value, `assert value ${path} of EDGE failed ${this.context}`)
    return this
  }
  assertHEAD(path, value) {
    this.tap.same(extract(path, this.doc.document.HEAD)[0], value, `assert value ${path} of HEAD failed ${this.context}`)
    return this
  }
  assertALL(path, values) {
    this.assertHEAD(path, values)
    this.assertEDGE(path, values)
    this.assertLOCAL(path, values)
    return this
  }
  didRebase() {
    this.tap.ok(this.onRebaseCalled, `should rebase ${this.context}`)
    return this
  }
  didNotRebase() {
    this.tap.notOk(this.onRebaseCalled, `should not rebase ${this.context}`)
    return this
  }
  onMutationFired() {
    this.tap.ok(this.onMutationCalled, `should mutate ${this.context}`)
    return this
  }
  onMutationDidNotFire() {
    this.tap.notOk(this.onMutationCalled, `should not mutate ${this.context}`)
    return this
  }
  isConsistent() {
    this.tap.ok(this.doc.document.isConsistent(), `should be consistent ${this.context}`)
    this.tap.same(this.doc.document.EDGE, this.doc.document.HEAD, `HEAD and EDGE should be equal ${this.context}`)
    return this
  }
  isInconsistent() {
    this.tap.notOk(this.doc.document.isConsistent(), `should not be consistent ${this.context}`)
    this.tap.notSame(this.doc.document.EDGE, this.doc.document.HEAD, `HEAD and EDGE should be different ${this.context}`)
    return this
  }
  hasUnresolvedLocalMutations() {
    this.tap.ok(this.doc.document.anyUnresolvedMutations(), `should be unresolved local mutations ${this.context}`)
    return this
  }
  noUnresolvedLocalMutations() {
    this.tap.notOk(this.doc.document.anyUnresolvedMutations(), `should be no unresolved local mutations ${this.context}`)
    return this
  }
  hasLocalEdits() {
    this.tap.ok(this.doc.mutations.length > 0, `should have local edits ${this.context}`)
    return this
  }
  hasNoLocalEdits() {
    this.tap.ok(this.doc.mutations.length == 0, `should not have local edits ${this.context}`)
    return this
  }
  hasPendingCommit() {
    this.tap.ok(this.doc.committerRunning, `should have pending commits ${this.context}`)
    return this
  }
  hasNoPendingCommit() {
    this.tap.notOk(this.doc.committerRunning, `should not have pending commits ${this.context}`)
    return this
  }
  end() {
    this.tap.end()
  }
}
