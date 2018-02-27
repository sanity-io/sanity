// @flow

// A test jig for the BufferedDocument model

import debugLogger from 'debug'
import {BufferedDocument, Mutation} from '../../src/document'
import {extract} from '../../src/jsonpath'

const debug = debugLogger('buffered-document-tester')

export default class BufferedDocumentTester {
  doc: BufferedDocument
  pendingCommit: ?Object
  onMutationCalled: boolean
  onRebaseCalled: boolean
  onDeleteCalled: boolean
  context: string
  tap: Object

  constructor(tap: any, attrs: any) {
    this.doc = new BufferedDocument(attrs)
    this.onRebaseCalled = false
    this.doc.onRebase = edge => {
      this.onRebaseCalled = true
    }
    this.doc.onMutation = (edge, mutation) => {
      this.onMutationCalled = true
    }
    this.doc.onDelete = local => {
      this.onDeleteCalled = true
    }
    this.doc.commitHandler = opts => {
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
  resetDocument(doc: any) {
    this.resetState()
    this.doc.reset(doc)
  }
  stage(title: string) {
    debug('Stage: %s', title)
    this.context = title
    return this
  }
  remotePatch(fromRev: ?string, toRev: string, patch: any): BufferedDocumentTester {
    this.resetState()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      previousRev: fromRev,
      mutations: [{patch}]
    })
    this.doc.arrive(mut)
    return this
  }
  remoteMutation(fromRev: ?string, toRev: string, operation: any): BufferedDocumentTester {
    this.resetState()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      previousRev: fromRev,
      mutations: [operation]
    })
    this.doc.arrive(mut)
    return this
  }
  localPatch(patch: any): BufferedDocumentTester {
    this.resetState()
    const mut = new Mutation({
      mutations: [{patch}]
    })
    this.doc.add(mut)
    return this
  }
  localMutation(fromRev: ?string, toRev: string, operation: any): BufferedDocumentTester {
    this.resetState()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      previousRev: fromRev,
      mutations: [operation]
    })
    debug('Local mutation: %O', mut)
    this.doc.add(mut)
    return this
  }
  commit(): BufferedDocumentTester {
    this.resetState()
    this.doc.commit()
    return this
  }
  commitSucceeds(): BufferedDocumentTester {
    this.resetState()
    const pendingCommit = this.pendingCommit
    if (!pendingCommit) return this
    pendingCommit.success()

    // Magically this commit is based on the current HEAD revision
    if (this.doc.document.HEAD && pendingCommit.mutation) {
      pendingCommit.mutation.params.previousRev = this.doc.document.HEAD._rev
    }

    this.doc.arrive(pendingCommit.mutation)

    this.pendingCommit = null
    return this
  }
  commitSucceedsButMutationArriveDuringCommitProcess(): BufferedDocumentTester {
    this.resetState()
    const pendingCommit = this.pendingCommit
    if (!pendingCommit) return this

    // Magically this commit is based on the current HEAD revision
    if (this.doc.document.HEAD) {
      pendingCommit.mutation.params.previousRev = this.doc.document.HEAD._rev
    }

    this.doc.arrive(pendingCommit.mutation)
    pendingCommit.success()

    this.pendingCommit = null
    return this
  }
  commitFails(): BufferedDocumentTester {
    this.resetState()
    if (this.pendingCommit) {
      this.pendingCommit.failure()
    }
    this.pendingCommit = null
    return this
  }
  assertLOCAL(path: string, value: any): BufferedDocumentTester {
    this.tap.same(
      extract(path, this.doc.LOCAL)[0],
      value,
      `assert value ${path} of LOCAL failed ${this.context}`
    )
    return this
  }
  assertEDGE(path: string, value: any): BufferedDocumentTester {
    this.tap.same(
      extract(path, this.doc.document.EDGE)[0],
      value,
      `assert value ${path} of EDGE failed ${this.context}`
    )
    return this
  }
  assertHEAD(path: string, value: any): BufferedDocumentTester {
    this.tap.same(
      extract(path, this.doc.document.HEAD)[0],
      value,
      `assert value ${path} of HEAD failed ${this.context}`
    )
    return this
  }
  assertALL(path: string, values: any): BufferedDocumentTester {
    this.assertHEAD(path, values)
    this.assertEDGE(path, values)
    this.assertLOCAL(path, values)
    return this
  }
  assertLOCALDeleted(): BufferedDocumentTester {
    this.tap.ok(this.doc.LOCAL === null, `LOCAL should be deleted ${this.context}`)
    return this
  }
  assertEDGEDeleted(): BufferedDocumentTester {
    this.tap.ok(this.doc.document.EDGE === null, `EDGE should be deleted ${this.context}`)
    return this
  }
  assertHEADDeleted(): BufferedDocumentTester {
    this.tap.ok(this.doc.document.HEAD === null, `HEAD should be deleted ${this.context}`)
    return this
  }
  assertALLDeleted(): BufferedDocumentTester {
    this.assertLOCALDeleted()
    this.assertEDGEDeleted()
    this.assertHEADDeleted()
    return this
  }
  assert(cb: Function): BufferedDocumentTester {
    cb(this.tap, this.doc)
    return this
  }
  didRebase(): BufferedDocumentTester {
    this.tap.ok(this.onRebaseCalled, `should rebase ${this.context}`)
    return this
  }
  didNotRebase(): BufferedDocumentTester {
    this.tap.notOk(this.onRebaseCalled, `should not rebase ${this.context}`)
    return this
  }
  onMutationFired(): BufferedDocumentTester {
    this.tap.ok(this.onMutationCalled, `should mutate ${this.context}`)
    return this
  }
  onMutationDidNotFire(): BufferedDocumentTester {
    this.tap.notOk(this.onMutationCalled, `should not mutate ${this.context}`)
    return this
  }
  onDeleteDidFire(): BufferedDocumentTester {
    this.tap.ok(this.onDeleteCalled, `should fire onDelete event ${this.context}`)
    return this
  }
  onDeleteDidNotFire(): BufferedDocumentTester {
    this.tap.notOk(this.onDeleteCalled, `should not fire onDelete event ${this.context}`)
    return this
  }
  isConsistent(): BufferedDocumentTester {
    this.tap.ok(this.doc.document.isConsistent(), `should be consistent ${this.context}`)
    this.tap.same(
      this.doc.document.EDGE,
      this.doc.document.HEAD,
      `HEAD and EDGE should be equal ${this.context}`
    )
    return this
  }
  isInconsistent(): BufferedDocumentTester {
    this.tap.notOk(this.doc.document.isConsistent(), `should not be consistent ${this.context}`)
    this.tap.notSame(
      this.doc.document.EDGE,
      this.doc.document.HEAD,
      `HEAD and EDGE should be different ${this.context}`
    )
    return this
  }
  hasUnresolvedLocalMutations(): BufferedDocumentTester {
    this.tap.ok(
      this.doc.document.anyUnresolvedMutations(),
      `should be unresolved local mutations ${this.context}`
    )
    return this
  }
  noUnresolvedLocalMutations(): BufferedDocumentTester {
    this.tap.notOk(
      this.doc.document.anyUnresolvedMutations(),
      `should be no unresolved local mutations ${this.context}`
    )
    return this
  }
  hasLocalEdits(): BufferedDocumentTester {
    this.tap.true(this.doc.buffer.hasChanges(), `should have local edits ${this.context}`)
    return this
  }
  hasNoLocalEdits(): BufferedDocumentTester {
    this.tap.false(this.doc.buffer.hasChanges(), `should not have local edits ${this.context}`)
    return this
  }
  hasPendingCommit(): BufferedDocumentTester {
    this.tap.ok(this.doc.committerRunning, `should have pending commits ${this.context}`)
    return this
  }
  hasNoPendingCommit(): BufferedDocumentTester {
    this.tap.notOk(this.doc.committerRunning, `should not have pending commits ${this.context}`)
    return this
  }
  end() {
    this.tap.end()
  }
}
