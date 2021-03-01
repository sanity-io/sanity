// A test jig for the BufferedDocument model

import debugLogger from 'debug'
import {BufferedDocument, Mutation} from '../../src/document'
import {extract} from '../../src/jsonpath'

const debug = debugLogger('buffered-document-tester')

export default class BufferedDocumentTester {
  doc: BufferedDocument
  context: any
  pendingCommit: any
  onMutationCalled: boolean
  onRebaseCalled: boolean
  onDeleteCalled: boolean
  tap: any

  constructor(tap, attrs) {
    this.doc = new BufferedDocument(attrs)
    this.onRebaseCalled = false
    this.doc.onRebase = (edge) => {
      this.onRebaseCalled = true
    }
    this.doc.onMutation = (edge, mutation) => {
      this.onMutationCalled = true
    }
    this.doc.onDelete = (local) => {
      this.onDeleteCalled = true
    }
    this.doc.commitHandler = (opts) => {
      this.pendingCommit = opts
    }
    this.tap = tap
    this.pendingCommit = null
    this.context = 'initially'
  }

  resetState() {
    this.onMutationCalled = false
    this.onRebaseCalled = false
    this.onDeleteCalled = false
  }

  resetDocument(doc) {
    this.resetState()
    this.doc.reset(doc)
  }

  stage(title) {
    debug('Stage: %s', title)
    this.context = title
    return this
  }

  remotePatch(fromRev, toRev, patch) {
    this.resetState()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      previousRev: fromRev,
      mutations: [{patch}],
    })
    this.doc.arrive(mut)
    return this
  }

  remoteMutation(fromRev, toRev, operation) {
    this.resetState()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      previousRev: fromRev,
      mutations: [operation],
    })
    this.doc.arrive(mut)
    return this
  }

  localPatch(patch) {
    this.resetState()
    const mut = new Mutation({
      mutations: [{patch}],
    })
    this.doc.add(mut)
    return this
  }

  localMutation(fromRev, toRev, operation) {
    this.resetState()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      previousRev: fromRev,
      mutations: [operation],
    })
    debug('Local mutation: %O', mut)
    this.doc.add(mut)
    return this
  }

  commit() {
    this.resetState()
    this.doc.commit()
    return this
  }

  commitSucceeds() {
    this.resetState()
    this.pendingCommit.success()
    // Magically this commit is based on the current HEAD revision
    if (this.doc.document.HEAD) {
      this.pendingCommit.mutation.params.previousRev = this.doc.document.HEAD._rev
    }
    this.doc.arrive(this.pendingCommit.mutation)
    this.pendingCommit = null
    return this
  }

  commitSucceedsButMutationArriveDuringCommitProcess() {
    this.resetState()
    // Magically this commit is based on the current HEAD revision
    if (this.doc.document.HEAD) {
      this.pendingCommit.mutation.params.previousRev = this.doc.document.HEAD._rev
    }
    this.doc.arrive(this.pendingCommit.mutation)
    this.pendingCommit.success()
    this.pendingCommit = null
    return this
  }

  commitFails() {
    this.resetState()
    this.pendingCommit.failure()
    this.pendingCommit = null
    return this
  }

  assertLOCAL(path, value) {
    this.tap.same(
      extract(path, this.doc.LOCAL)[0],
      value,
      `assert value ${path} of LOCAL failed ${this.context}`
    )
    return this
  }

  assertEDGE(path, value) {
    this.tap.same(
      extract(path, this.doc.document.EDGE)[0],
      value,
      `assert value ${path} of EDGE failed ${this.context}`
    )
    return this
  }

  assertHEAD(path, value) {
    this.tap.same(
      extract(path, this.doc.document.HEAD)[0],
      value,
      `assert value ${path} of HEAD failed ${this.context}`
    )
    return this
  }

  assertALL(path, values) {
    this.assertHEAD(path, values)
    this.assertEDGE(path, values)
    this.assertLOCAL(path, values)
    return this
  }

  assertLOCALDeleted() {
    this.tap.ok(this.doc.LOCAL === null, `LOCAL should be deleted ${this.context}`)
    return this
  }

  assertEDGEDeleted() {
    this.tap.ok(this.doc.document.EDGE === null, `EDGE should be deleted ${this.context}`)
    return this
  }

  assertHEADDeleted() {
    this.tap.ok(this.doc.document.HEAD === null, `HEAD should be deleted ${this.context}`)
    return this
  }

  assertALLDeleted() {
    this.assertLOCALDeleted()
    this.assertEDGEDeleted()
    this.assertHEADDeleted()
    return this
  }

  assert(cb) {
    cb(this.tap, this.doc)
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

  onDeleteDidFire() {
    this.tap.ok(this.onDeleteCalled, `should fire onDelete event ${this.context}`)
    return this
  }

  onDeleteDidNotFire() {
    this.tap.notOk(this.onDeleteCalled, `should not fire onDelete event ${this.context}`)
    return this
  }

  isConsistent() {
    this.tap.ok(this.doc.document.isConsistent(), `should be consistent ${this.context}`)
    this.tap.same(
      this.doc.document.EDGE,
      this.doc.document.HEAD,
      `HEAD and EDGE should be equal ${this.context}`
    )
    return this
  }

  isInconsistent() {
    this.tap.notOk(this.doc.document.isConsistent(), `should not be consistent ${this.context}`)
    this.tap.notSame(
      this.doc.document.EDGE,
      this.doc.document.HEAD,
      `HEAD and EDGE should be different ${this.context}`
    )
    return this
  }

  hasUnresolvedLocalMutations() {
    this.tap.ok(
      this.doc.document.anyUnresolvedMutations(),
      `should be unresolved local mutations ${this.context}`
    )
    return this
  }

  noUnresolvedLocalMutations() {
    this.tap.notOk(
      this.doc.document.anyUnresolvedMutations(),
      `should be no unresolved local mutations ${this.context}`
    )
    return this
  }

  hasLocalEdits() {
    this.tap.true(this.doc.buffer.hasChanges(), `should have local edits ${this.context}`)
    return this
  }

  hasNoLocalEdits() {
    this.tap.false(this.doc.buffer.hasChanges(), `should not have local edits ${this.context}`)
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
