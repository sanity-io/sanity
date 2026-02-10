import {makePatches, stringifyPatches} from '@sanity/diff-match-patch'

import {arrayToJSONMatchPath} from '../jsonpath/arrayToJSONMatchPath'
import {extractWithPath} from '../jsonpath/extractWithPath'
import {debug} from './debug'
import {Mutation} from './Mutation'
import {type Doc, type Mut} from './types'

/**
 * Implements a buffer for mutations that incrementally optimises the mutations by
 * eliminating set-operations that overwrite earlier set-operations, and rewrite
 * set-operations that change strings into other strings into diffMatchPatch operations.
 *
 * @internal
 */
export class SquashingBuffer {
  /**
   * The document forming the basis of this squash
   */
  BASIS: Doc | null

  /**
   * The document after the out-Mutation has been applied, but before the staged
   * operations are committed.
   */
  PRESTAGE: Doc | null

  /**
   * setOperations contain the latest set operation by path. If the set-operations are
   * updating strings to new strings, they are rewritten as diffMatchPatch operations,
   * any new set operations on the same paths overwrites any older set operations.
   * Only set-operations assigning plain values to plain values gets optimized like this.
   */
  setOperations: Record<string, Mut | undefined>

  /**
   * `documentPresent` is true whenever we know that the document must be present due
   * to preceeding mutations. `false` implies that it may or may not already exist.
   */
  documentPresent: boolean

  /**
   * The operations in the out-Mutation are not able to be optimized any further
   */
  out: Mut[] = []

  /**
   * Staged mutation operations
   */
  staged: Mut[]

  constructor(doc: Doc | null) {
    if (doc) {
      debug('Reset mutation buffer to rev %s', doc._rev)
    } else {
      debug('Reset mutation buffer state to document being deleted')
    }

    this.staged = []
    this.setOperations = {}
    this.documentPresent = false

    this.BASIS = doc
    this.PRESTAGE = doc
  }

  add(mut: Mutation): void {
    mut.mutations.forEach((op) => this.addOperation(op))
  }

  hasChanges(): boolean {
    return this.out.length > 0 || Object.keys(this.setOperations).length > 0
  }

  /**
   * Extracts the mutations in this buffer.
   * After this is done, the buffer lifecycle is over and the client should
   * create an new one with the new, updated BASIS.
   *
   * @param txnId - Transaction ID
   * @returns A `Mutation` instance if we had outgoing mutations pending, null otherwise
   */
  purge(txnId?: string): Mutation | null {
    this.stashStagedOperations()
    let result = null
    if (this.out.length > 0) {
      debug('Purged mutation buffer')
      result = new Mutation({
        mutations: this.out,
        resultRev: txnId,
        transactionId: txnId,
      })
    }
    this.out = []
    this.documentPresent = false
    return result
  }

  addOperation(op: Mut): void {
    // Is this a patch that only contains a `set` operation (plus `id`)?
    // We check for the specific keys we can optimize rather than relying on key count,
    // so that unexpected additional keys (e.g. `ifRevisionID`) safely fall through
    // to the generic handler instead of being silently dropped.
    if (
      op.patch &&
      op.patch.set &&
      'id' in op.patch &&
      op.patch.id === this.PRESTAGE?._id &&
      !op.patch.setIfMissing &&
      !op.patch.diffMatchPatch &&
      !op.patch.unset &&
      !op.patch.inc &&
      !op.patch.dec &&
      !op.patch.insert &&
      !op.patch.merge
    ) {
      const setPatch = op.patch.set
      const unoptimizable: Record<string, unknown> = {}
      // Apply all optimisable keys in the patch
      for (const path of Object.keys(setPatch)) {
        if (setPatch.hasOwnProperty(path)) {
          if (!this.optimiseSetOperation(path, setPatch[path])) {
            // If not optimisable, add to unoptimizable set
            unoptimizable[path] = setPatch[path]
          }
        }
      }

      // If any weren't optimisable, add them to an unoptimised set-operation, then
      // stash everything.
      if (Object.keys(unoptimizable).length > 0) {
        debug('Unoptimizable set-operation detected, purging optimization buffer')
        this.staged.push({patch: {id: this.PRESTAGE._id, set: unoptimizable}})
        this.stashStagedOperations()
      }

      return
    }

    // Is this a createIfNotExists for our document?
    if (op.createIfNotExists && this.PRESTAGE && op.createIfNotExists._id === this.PRESTAGE._id) {
      if (!this.documentPresent) {
        // If we don't know that it's present we'll have to stage and stash.
        this.staged.push(op)
        this.documentPresent = true
        this.stashStagedOperations()
      }

      // Otherwise we can fully ignore it.
      return
    }

    // Is this a patch that only contains a `setIfMissing` operation (plus `id`)?
    //
    // setIfMissing sets a value at a path only if that path doesn't already exist.
    // When editing an existing document, most setIfMissing operations target paths
    // that already have values — making them no-ops that the server would discard.
    //
    // Without this optimization, every setIfMissing falls through to the generic
    // handler which calls stashStagedOperations(). That flushes the optimization
    // buffer, preventing subsequent `set` operations from being squashed into
    // efficient diffMatchPatch operations. On deeply nested schemas, this means
    // each keystroke generates 8+ redundant actions instead of 1.
    //
    // The optimization:
    // - If ALL paths already exist in PRESTAGE → drop the entire op (it's a no-op)
    // - If some paths are new → stage it without flushing, so squashing continues
    //
    // We check for specific known keys rather than key count, so that patches with
    // unexpected additional keys safely fall through to the generic handler.
    if (
      op.patch &&
      op.patch.setIfMissing &&
      'id' in op.patch &&
      op.patch.id === this.PRESTAGE?._id &&
      !op.patch.set &&
      !op.patch.diffMatchPatch &&
      !op.patch.unset &&
      !op.patch.inc &&
      !op.patch.dec &&
      !op.patch.insert &&
      !op.patch.merge
    ) {
      const setIfMissingPatch = op.patch.setIfMissing
      let allRedundant = true

      for (const path of Object.keys(setIfMissingPatch)) {
        if (setIfMissingPatch.hasOwnProperty(path)) {
          // extractWithPath resolves the path against the current document state.
          // If it finds a non-nullish value, the path exists and setIfMissing would
          // be a no-op on the server — safe to drop.
          const matches = extractWithPath(path, this.PRESTAGE)
          if (matches.length === 0 || matches[0].value === undefined || matches[0].value === null) {
            // Path doesn't exist or is nullish — this setIfMissing is needed
            allRedundant = false
            break
          }
        }
      }

      if (allRedundant) {
        // All paths already exist — the entire setIfMissing would be a no-op.
        // Drop it without flushing the optimization buffer.
        debug('Dropping redundant setIfMissing (all paths already exist in document)')
        return
      }

      // Some paths are genuinely new — we must keep this setIfMissing.
      // Stage it WITHOUT calling stashStagedOperations(), so that subsequent
      // set operations can still be optimized by the squasher.
      // Update PRESTAGE so future path checks reflect the new paths.
      this.staged.push(op)
      this.PRESTAGE = new Mutation({mutations: [op]}).apply(this.PRESTAGE) as Doc
      return
    }

    debug('Unoptimizable mutation detected, purging optimization buffer')
    // console.log("Unoptimizable operation, stashing", JSON.stringify(op))
    // Un-optimisable operations causes everything to be stashed
    this.staged.push(op)
    this.stashStagedOperations()
  }

  /**
   * Attempt to perform one single set operation in an optimised manner, return value
   * reflects whether or not the operation could be performed.

   * @param path - The JSONPath to the set operation in question
   * @param nextValue - The value to be set
   * @returns True of optimized, false otherwise
   */
  optimiseSetOperation(path: string, nextValue: unknown): boolean {
    // console.log('optimiseSetOperation', path, nextValue)
    // If target value is not a plain value, unable to optimise
    if (typeof nextValue === 'object') {
      // console.log("Not optimisable because next value is object")
      return false
    }

    // Check the source values, if there is more than one value being assigned,
    // we won't optimise
    const matches = extractWithPath(path, this.PRESTAGE)
    // If we are not overwriting exactly one key, this cannot be optimised, so we bail
    if (matches.length !== 1) {
      // console.log('Not optimisable because match count is != 1', JSON.stringify(matches))
      return false
    }

    // Okay, we are assigning exactly one value to exactly one existing slot, so we might optimise
    const match = matches[0]
    // If the value of the match is an array or object, we cannot safely optimise this since the meaning
    // of pre-existing operations might change (in theory, at least), so we bail
    if (typeof match.value === 'object') {
      // console.log("Not optimisable because old value is object")
      return false
    }

    if (!this.PRESTAGE) {
      // Shouldn't happen, but makes typescript happy
      return false
    }

    // If the new and old value are the equal, we optimise this operation by discarding it
    // Now, let's build the operation
    let op: Mut | null = null
    if (match.value === nextValue) {
      // If new and old values are equal, we optimise this by deleting the operation
      // console.log("Omitting operation")
      op = null
    } else if (typeof match.value === 'string' && typeof nextValue === 'string') {
      // console.log("Rewriting to dmp")
      // We are updating a string to another string, so we are making a diffMatchPatch
      try {
        const patch = stringifyPatches(makePatches(match.value, nextValue))
        op = {patch: {id: this.PRESTAGE._id, diffMatchPatch: {[path]: patch}}}
      } catch {
        // patch_make failed due to unicode issue https://github.com/google/diff-match-patch/issues/59
        return false
      }
    } else {
      // console.log("Not able to rewrite to dmp, making normal set")
      // We are changing the type of the value, so must make a normal set-operation
      op = {patch: {id: this.PRESTAGE._id, set: {[path]: nextValue}}}
    }

    // Let's make a plain, concrete path from the array-path. We use this to keep only the latest set
    // operation touching this path in the buffer.
    const canonicalPath = arrayToJSONMatchPath(match.path)

    // Store this operation, overwriting any previous operations touching this same path
    if (op) {
      this.setOperations[canonicalPath] = op
    } else {
      delete this.setOperations[canonicalPath]
    }

    // Signal that we succeeded in optimizing this patch
    return true
  }

  stashStagedOperations(): void {
    // Short circuit if there are no staged operations
    const nextOps: Mut[] = []

    // Extract the existing outgoing operations if any
    Object.keys(this.setOperations).forEach((key) => {
      const op = this.setOperations[key]
      if (op) {
        nextOps.push(op)
      }
    })

    nextOps.push(...this.staged)
    if (nextOps.length > 0) {
      this.PRESTAGE = new Mutation({mutations: nextOps}).apply(this.PRESTAGE) as Doc
      this.staged = []
      this.setOperations = {}
    }

    this.out.push(...nextOps)
  }

  /**
   * Rebases given the new base-document
   *
   * @param newBasis - New base document to rebase on
   * @returns New "edge" document with buffered changes integrated
   */
  rebase(newBasis: Doc | null): Doc | null {
    this.stashStagedOperations()

    if (newBasis === null) {
      // If document was just deleted, we must throw out local changes
      this.out = []
      this.BASIS = newBasis
      this.PRESTAGE = newBasis
      this.documentPresent = false
    } else {
      this.BASIS = newBasis

      // @todo was this supposed to be `this.out.length > 0`?
      // surely this is always `true`?
      if (this.out) {
        this.PRESTAGE = new Mutation({mutations: this.out}).apply(this.BASIS) as Doc
      } else {
        this.PRESTAGE = this.BASIS
      }
    }

    return this.PRESTAGE
  }
}
