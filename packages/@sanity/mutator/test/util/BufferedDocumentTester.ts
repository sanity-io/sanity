// A test jig for the BufferedDocument model
import {type PatchMutationOperation} from '@sanity/types'
import debugLogger from 'debug'
import {expect} from 'vitest'

import {BufferedDocument} from '../../src/document/BufferedDocument'
import {Mutation} from '../../src/document/Mutation'
import {type CommitHandlerMessage} from '../../src/document/BufferedDocument'
import {type Doc, type Mut} from '../../src/document/types'
import {extract} from '../../src/jsonpath'

const debug = debugLogger('buffered-document-tester')

export class BufferedDocumentTester {
  doc: BufferedDocument
  context: string
  pendingCommit: CommitHandlerMessage | null

  onMutationCalled = false
  onRebaseCalled = false
  onDeleteCalled = false

  constructor(attrs: Doc) {
    this.doc = new BufferedDocument(attrs)
    this.onRebaseCalled = false
    this.doc.onRebase = () => {
      this.onRebaseCalled = true
    }
    this.doc.onMutation = () => {
      this.onMutationCalled = true
    }
    this.doc.onDelete = () => {
      this.onDeleteCalled = true
    }
    this.doc.commitHandler = (opts) => {
      this.pendingCommit = opts
    }
    this.pendingCommit = null
    this.context = 'initially'
  }

  resetState(): void {
    this.onMutationCalled = false
    this.onRebaseCalled = false
    this.onDeleteCalled = false
  }

  resetDocument(doc: Doc | null): void {
    this.resetState()
    this.doc.reset(doc)
  }

  stage(title: string): this {
    debug('Stage: %s', title)
    this.context = title
    return this
  }

  remotePatch(fromRev: string, toRev: string, patch: PatchMutationOperation): this {
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

  remoteMutation(fromRev: string | undefined, toRev: string, operation: Mut): this {
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

  localPatch(patch: PatchMutationOperation): this {
    this.resetState()
    const mut = new Mutation({
      mutations: [{patch}],
    })
    this.doc.add(mut)
    return this
  }

  localMutation(fromRev: string | undefined, toRev: string, operation: Mut): this {
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

  commit(): this {
    this.resetState()
    this.doc.commit()
    return this
  }

  commitSucceeds(): this {
    if (!this.pendingCommit) {
      throw new Error('`pendingCommit` not set')
    }

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

  commitSucceedsButMutationArriveDuringCommitProcess(): this {
    if (!this.pendingCommit) {
      throw new Error('`pendingCommit` not set')
    }

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

  commitFails(): this {
    if (!this.pendingCommit) {
      throw new Error('`pendingCommit` not set')
    }

    this.resetState()
    this.pendingCommit.failure()
    this.pendingCommit = null
    return this
  }

  assertLOCAL(path: string, value: unknown): this {
    expect(extract(path, this.doc.LOCAL)[0]).toEqual(value)
    return this
  }

  assertEDGE(path: string, value: unknown): this {
    expect(extract(path, this.doc.document.EDGE)[0]).toEqual(value)
    return this
  }

  assertHEAD(path: string, value: unknown): this {
    expect(extract(path, this.doc.document.HEAD)[0]).toEqual(value)
    return this
  }

  assertALL(path: string, values: unknown): this {
    this.assertHEAD(path, values)
    this.assertEDGE(path, values)
    this.assertLOCAL(path, values)
    return this
  }

  assertLOCALDeleted(): this {
    expect(this.doc.LOCAL === null).toBe(true)
    return this
  }

  assertEDGEDeleted(): this {
    expect(this.doc.document.EDGE === null).toBe(true)
    return this
  }

  assertHEADDeleted(): this {
    expect(this.doc.document.HEAD === null).toBe(true)
    return this
  }

  assertALLDeleted(): this {
    this.assertLOCALDeleted()
    this.assertEDGEDeleted()
    this.assertHEADDeleted()
    return this
  }

  assert(cb: (doc: BufferedDocument | null) => void): this {
    cb(this.doc)
    return this
  }

  didRebase(): this {
    expect(this.onRebaseCalled).toBe(true)
    return this
  }

  didNotRebase(): this {
    expect(this.onRebaseCalled).toBe(false)
    return this
  }

  onMutationFired(): this {
    expect(this.onMutationCalled).toBe(true)
    return this
  }

  onMutationDidNotFire(): this {
    expect(this.onMutationCalled).toBe(false)
    return this
  }

  onDeleteDidFire(): this {
    expect(this.onDeleteCalled).toBe(true)
    return this
  }

  onDeleteDidNotFire(): this {
    expect(this.onDeleteCalled).toBe(false)
    return this
  }

  isConsistent(): this {
    expect(this.doc.document.isConsistent()).toBe(true)
    expect(this.doc.document.EDGE).toEqual(this.doc.document.HEAD)
    return this
  }

  isInconsistent(): this {
    expect(this.doc.document.isConsistent()).toBe(false)
    expect(this.doc.document.EDGE).not.toEqual(this.doc.document.HEAD)
    return this
  }

  hasUnresolvedLocalMutations(): this {
    expect(this.doc.document.hasUnresolvedMutations()).toBe(true)
    return this
  }

  noUnresolvedLocalMutations(): this {
    expect(this.doc.document.hasUnresolvedMutations()).toBe(false)
    return this
  }

  hasLocalEdits(): this {
    expect(this.doc.buffer.hasChanges()).toBe(true)
    return this
  }

  hasNoLocalEdits(): this {
    expect(this.doc.buffer.hasChanges()).toBe(false)
    return this
  }

  hasPendingCommit(): this {
    expect(this.doc.committerRunning).toBe(true)
    return this
  }

  hasNoPendingCommit(): this {
    expect(this.doc.committerRunning).toBe(false)
    return this
  }
}
