import * as DiffMatchPatch from 'diff-match-patch'
import extractWithPath from '../jsonpath/extractWithPath'
import arrayToJSONMatchPath from '../jsonpath/arrayToJSONMatchPath'
import Mutation from './Mutation'
import debug from './debug'
import {Doc, Mut} from './types'

// Implements a buffer for mutations that incrementally optimises the mutations by eliminating set-operations that
// overwrite earlier set-operations, and rewrite set-operations that change strings into other strings into diffMatchPatch
// operations.
export default class SquashingBuffer {
  // The document forming the basis of this squash
  BASIS: Doc
  // The operations in the out-Mutation are not able to be optimized any further
  out: Array<any> = []
  // The document after the out-Mutation has been applied, but before the staged operations are committed.
  PRESTAGE: Doc
  // setOperations contain the latest set operation by path. If the set-operations are updating strings to new
  // strings, they are rewritten as diffMatchPatch operations, any new set operations on the same paths overwrites
  // any older set operations. Only set-operations assigning plain values to plain values gets optimized like this.
  setOperations: Object
  // documentPresent is true whenever we know that the document must be present due to preceeding mutations.
  // false implies that it may or may not already exist.
  documentPresent: boolean
  staged: Array<any>
  dmp: DiffMatchPatch.diff_match_patch

  constructor(doc: Doc) {
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
    this.dmp = new DiffMatchPatch.diff_match_patch()
  }

  add(mut: Mutation) {
    mut.mutations.forEach((op) => this.addOperation(op))
  }

  hasChanges() {
    return this.out.length > 0 || Object.keys(this.setOperations).length > 0
  }

  // Extracts the mutations in this buffer. After this is done, the buffer lifecycle is over and the client should
  // create an new one with the new, updated BASIS.
  purge(txnId?: string): Mutation {
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

  addOperation(op: Mut) {
    // Is this a set patch, and only a set patch, and does it apply to the document at hand?
    if (
      op.patch &&
      op.patch.set &&
      op.patch.id === this.PRESTAGE._id &&
      Object.keys(op.patch).length == 2
    ) {
      // console.log("Attempting to apply optimised set patch")
      const setPatch = op.patch.set
      const unoptimizable = {}
      // Apply all optimisable keys in the patch
      for (const path of Object.keys(setPatch)) {
        // console.log("...", path)
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

    debug('Unoptimizable mutation detected, purging optimization buffer')
    // console.log("Unoptimizable operation, stashing", JSON.stringify(op))
    // Un-optimisable operations causes everything to be stashed
    this.staged.push(op)
    this.stashStagedOperations()
  }

  // Attempt to perform one single set operation in an optimised manner, return value reflects whether the
  // operation could be performed.
  optimiseSetOperation(path: string, nextValue: any): boolean {
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
    // If the new and old value are the equal, we optimise this operation by discarding it
    // Now, let's build the operation
    let op
    if (match.value === nextValue) {
      // If new and old values are equal, we optimise this by deleting the operation
      // console.log("Omitting operation")
      op = null
    } else if (typeof match.value === 'string' && typeof nextValue === 'string') {
      // console.log("Rewriting to dmp")
      // We are updating a string to another string, so we are making a diffMatchPatch
      try {
        const patch = this.dmp
          .patch_make(match.value, nextValue)
          .map((patch) => patch.toString())
          .join('')
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

  stashStagedOperations() {
    // console.log('stashStagedOperations')
    // Short circuit if there are no staged operations
    const nextOps = []

    // Extract the existing outgoing operations if any
    Object.keys(this.setOperations).forEach((key) => {
      nextOps.push(this.setOperations[key])
    })
    nextOps.push(...this.staged)
    if (nextOps.length > 0) {
      this.PRESTAGE = new Mutation({mutations: nextOps}).apply(this.PRESTAGE)
      this.staged = []
      this.setOperations = {}
    }
    this.out.push(...nextOps)
  }

  // Rebases given the new base-document. Returns the new "edge" document with the buffered changes
  // integrated.
  rebase(newBasis: Doc) {
    this.stashStagedOperations()
    if (newBasis === null) {
      // If document was just deleted, we must throw out local changes
      this.out = []
      this.PRESTAGE = this.BASIS = newBasis
      this.documentPresent = false
    } else {
      this.BASIS = newBasis
      if (this.out) {
        this.PRESTAGE = new Mutation({mutations: this.out}).apply(this.BASIS)
      } else {
        this.PRESTAGE = this.BASIS
      }
    }
    return this.PRESTAGE
  }
}
