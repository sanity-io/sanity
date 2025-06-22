// A test jig for the Document model
import {type PatchMutationOperation} from '@sanity/types'
import {expect} from 'vitest'

import {Document} from '../../src/document/Document'
import {Mutation} from '../../src/document/Mutation'
import {type SubmissionResponder} from '../../src/document/Document'
import {type Doc} from '../../src/document/types'
import {extract} from '../../src/jsonpath'

export class DocumentTester {
  onRebaseCalled = false
  onMutationCalled = false
  context: string
  staged: Record<string, Mutation | undefined>
  stagedResponders: Record<string, SubmissionResponder | undefined>
  doc: Document

  constructor(attrs: Doc) {
    this.doc = new Document(attrs)
    this.onRebaseCalled = false
    this.doc.onRebase = () => {
      this.onRebaseCalled = true
    }
    this.doc.onMutation = () => {
      this.onMutationCalled = true
    }
    this.staged = {}
    this.stagedResponders = {}
    this.context = 'initially'
  }

  reset(): void {
    this.onMutationCalled = false
    this.onRebaseCalled = false
  }

  stage(title: string): this {
    this.context = title
    return this
  }

  remotePatch(fromRev: string, toRev: string, patch: PatchMutationOperation): this {
    this.reset()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      previousRev: fromRev,
      mutations: [{patch}],
    })
    this.doc.arrive(mut)
    return this
  }

  localPatch(fromRev: string, toRev: string, patch: PatchMutationOperation): this {
    this.reset()
    const mut = new Mutation({
      transactionId: toRev,
      resultRev: toRev,
      // oxlint-disable-next-line ban-ts-comment
      // @ts-expect-error
      _previousRev: fromRev, // not known to receiver yet
      mutations: [{patch}],
    })
    this.staged[toRev] = mut
    this.stagedResponders[toRev] = this.doc.stage(mut)
    return this
  }

  localSucceeded(txnId: string): this {
    const responder = this.stagedResponders[txnId]
    if (!responder) {
      throw new Error(`Missing staged responder for transaction ID "${txnId}"`)
    }

    this.reset()
    responder.success()
    delete this.stagedResponders[txnId]
    return this
  }

  localFailed(txnId: string): this {
    const responder = this.stagedResponders[txnId]
    if (!responder) {
      throw new Error(`Missing staged responder for transaction ID "${txnId}"`)
    }

    this.reset()
    responder.failure()
    delete this.stagedResponders[txnId]
    return this
  }

  arrivedLocal(txnId: string): this {
    this.reset()
    const submitted = this.staged[txnId]
    if (!submitted) {
      throw new Error(`Missing staged changes for transaction "${txnId}"`)
    }

    // The _previousRev is a hack internal to this document tester
    const params = Object.assign({}, submitted.params)
    params.previousRev = '_previousRev' in params ? (params as any)._previousRev : undefined

    const mut = new Mutation(params)
    this.doc.arrive(mut)
    return this
  }

  assertEDGE(path: string, value: unknown): this {
    expect(extract(path, this.doc.EDGE)[0]).toEqual(value)
    return this
  }

  assertHEAD(path: string, value: unknown): this {
    expect(extract(path, this.doc.HEAD)[0]).toEqual(value)
    return this
  }

  assertBOTH(path: string, values: unknown): this {
    this.assertHEAD(path, values)
    this.assertEDGE(path, values)
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

  isConsistent(): this {
    expect(this.doc.isConsistent()).toBe(true)
    expect(this.doc.EDGE).toEqual(this.doc.HEAD)
    return this
  }

  isInconsistent(): this {
    expect(this.doc.isConsistent()).toBe(false)
    expect(this.doc.EDGE).not.toEqual(this.doc.HEAD)
    return this
  }

  hasUnresolvedLocalMutations(): this {
    expect(this.doc.hasUnresolvedMutations()).toBe(true)
    return this
  }

  noUnresolvedLocalMutations(): this {
    expect(this.doc.hasUnresolvedMutations()).toBe(false)
    return this
  }
}
