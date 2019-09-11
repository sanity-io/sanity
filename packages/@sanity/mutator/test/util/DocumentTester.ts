// A test jig for the Document model

import {Document, Mutation} from '../../src/document'
import {extract} from '../../src/jsonpath'

export default class DocumentTester {
  onRebaseCalled: boolean
  onMutationCalled: boolean
  context: any
  staged: any
  stagedResponders: any
  tap: any
  doc: Document
  constructor(tap, attrs) {
    this.doc = new Document(attrs)
    this.onRebaseCalled = false
    this.doc.onRebase = edge => {
      this.onRebaseCalled = true
    }
    this.doc.onMutation = (edge, mutation) => {
      this.onMutationCalled = true
    }
    this.tap = tap
    this.staged = {}
    this.stagedResponders = {}
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
  localPatch(fromRev, toRev, patch) {
    this.reset()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      // @ts-ignore
      _previousRev: fromRev, // not known to receiver yet
      mutations: [{patch}]
    })
    this.staged[toRev] = mut
    this.stagedResponders[toRev] = this.doc.stage(mut)
    return this
  }
  localSucceeded(txnId) {
    this.reset()
    this.stagedResponders[txnId].success()
    delete this.stagedResponders[txnId]
    return this
  }
  localFailed(txnId) {
    this.reset()
    this.stagedResponders[txnId].failure()
    delete this.stagedResponders[txnId]
    return this
  }
  arrivedLocal(txnId) {
    this.reset()
    const submitted = this.staged[txnId]
    const params = Object.assign({}, submitted.params)
    params.previousRev = params._previousRev
    const mut = new Mutation(params)
    this.doc.arrive(mut)
    return this
  }
  assertEDGE(path, value) {
    this.tap.same(extract(path, this.doc.EDGE)[0], value, `assert value ${path} of EDGE`)
    return this
  }
  assertHEAD(path, value) {
    this.tap.same(extract(path, this.doc.HEAD)[0], value, `assert value ${path} of HEAD`)
    return this
  }
  assertBOTH(path, values) {
    this.assertHEAD(path, values)
    this.assertEDGE(path, values)
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
    this.tap.ok(this.doc.isConsistent(), `should be consistent ${this.context}`)
    this.tap.same(this.doc.EDGE, this.doc.HEAD, `HEAD and EDGE should be equal ${this.context}`)
    return this
  }
  isInconsistent() {
    this.tap.notOk(this.doc.isConsistent(), `should not be consistent ${this.context}`)
    this.tap.notSame(
      this.doc.EDGE,
      this.doc.HEAD,
      `HEAD and EDGE should be different ${this.context}`
    )
    return this
  }
  hasUnresolvedLocalMutations() {
    this.tap.ok(
      this.doc.anyUnresolvedMutations(),
      `should be unresolved local mutations ${this.context}`
    )
    return this
  }
  noUnresolvedLocalMutations() {
    this.tap.notOk(
      this.doc.anyUnresolvedMutations(),
      `should be no unresolved local mutations ${this.context}`
    )
    return this
  }
  end() {
    this.tap.end()
  }
}
