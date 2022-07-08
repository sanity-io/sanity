import {Patcher} from '../patch'
import {luid} from './luid'
import {debug} from './debug'
import type {Doc, Mut} from './types'

/**
 * Parameters attached to the mutation
 *
 * @internal
 */
export interface MutationParams {
  transactionId?: string
  transition?: string
  identity?: string
  previousRev?: string
  resultRev?: string
  mutations: Mut[]
  timestamp?: string
  effects?: {apply: unknown; revert: unknown}
}

/**
 * A mutation describing a number of operations on a single document.
 * This should be considered an immutable structure. Mutations are compiled
 * on first application, and any changes in properties will not effectively
 * change its behavior after that.
 *
 * @internal
 */
export class Mutation {
  params: MutationParams

  compiled?: (doc: Doc | null) => Doc | null

  _appliesToMissingDocument: boolean | undefined

  constructor(options: MutationParams) {
    this.params = options
  }

  get transactionId(): string | undefined {
    return this.params.transactionId
  }

  get transition(): string | undefined {
    return this.params.transition
  }

  get identity(): string | undefined {
    return this.params.identity
  }

  get previousRev(): string | undefined {
    return this.params.previousRev
  }

  get resultRev(): string | undefined {
    return this.params.resultRev
  }

  get mutations(): Mut[] {
    return this.params.mutations
  }

  get timestamp(): Date | undefined {
    if (typeof this.params.timestamp === 'string') {
      return new Date(this.params.timestamp)
    }

    return undefined
  }

  get effects():
    | {
        apply: unknown
        revert: unknown
      }
    | undefined {
    return this.params.effects
  }

  assignRandomTransactionId(): void {
    this.params.transactionId = luid()
    this.params.resultRev = this.params.transactionId
  }

  appliesToMissingDocument(): boolean {
    if (typeof this._appliesToMissingDocument !== 'undefined') {
      return this._appliesToMissingDocument
    }

    // Only mutations starting with a create operation apply to documents that do not exist ...
    const firstMut = this.mutations[0]
    if (firstMut) {
      this._appliesToMissingDocument = Boolean(
        firstMut.create || firstMut.createIfNotExists || firstMut.createOrReplace
      )
    } else {
      this._appliesToMissingDocument = true
    }

    return this._appliesToMissingDocument
  }

  // Compiles all mutations into a handy function
  compile(): void {
    const operations: ((doc: Doc | null) => Doc | null)[] = []

    this.mutations.forEach((mutation) => {
      if (mutation.create) {
        // TODO: Fail entire patch if document did exist
        const create = mutation.create || {}
        operations.push((doc): Doc => {
          if (doc) {
            return doc
          }

          return Object.assign(create as Doc, {
            _createdAt: create._createdAt || this.params.timestamp,
          })
        })
        return
      }

      if (mutation.createIfNotExists) {
        const createIfNotExists = mutation.createIfNotExists || {}
        operations.push((doc) =>
          doc === null
            ? Object.assign(createIfNotExists, {
                _createdAt: createIfNotExists._createdAt || this.params.timestamp,
              })
            : doc
        )
        return
      }

      if (mutation.createOrReplace) {
        const createOrReplace = mutation.createOrReplace || {}
        operations.push(() =>
          Object.assign(createOrReplace, {
            _createdAt: createOrReplace._createdAt || this.params.timestamp,
          })
        )
        return
      }

      if (mutation.delete) {
        operations.push(() => null)
        return
      }

      if (mutation.patch) {
        if ('query' in mutation.patch) {
          // @todo Warn/throw? Investigate if this can ever happen
          return
        }

        const patch = new Patcher(mutation.patch)
        operations.push((doc) => patch.apply(doc) as Doc | null)
        return
      }

      throw new Error(`Unsupported mutation ${JSON.stringify(mutation, null, 2)}`)
    })

    // Assign `_updatedAt` to the timestamp of the mutation if set
    if (typeof this.params.timestamp === 'string') {
      operations.push((doc) => {
        return doc ? Object.assign(doc, {_updatedAt: this.params.timestamp}) : null
      })
    }

    const prevRev = this.previousRev
    const rev = this.resultRev || this.transactionId
    this.compiled = (doc: Doc | null) => {
      if (prevRev && doc && prevRev !== doc._rev) {
        throw new Error(
          `Previous revision for this mutation was ${prevRev}, but the document revision is ${doc._rev}`
        )
      }

      let result: Doc | null = doc
      for (const operation of operations) {
        result = operation(result)
      }

      // Should update _rev?
      if (result && rev) {
        // Ensure that result is a unique object, even if the operation was a no-op
        if (result === doc) {
          result = Object.assign({}, doc)
        }
        result._rev = rev
      }

      return result
    }
  }

  apply(document: Doc | null): Doc | null {
    debug('Applying mutation %O to document %O', this.mutations, document)
    if (!this.compiled) {
      this.compile()
    }

    const result = this.compiled!(document)
    debug('  => %O', result)
    return result
  }

  static applyAll(document: Doc | null, mutations: Mutation[]): Doc | null {
    return mutations.reduce((doc, mutation) => mutation.apply(doc), document)
  }

  // Given a number of yet-to-be-committed mutation objects, collects them into one big mutation
  // any metadata like transactionId is ignored and must be submitted by the client. It is assumed
  // that all mutations are on the same document.
  // TOOO: Optimize mutations, eliminating mutations that overwrite themselves!
  static squash(document: Doc | null, mutations: Mutation[]): Mutation {
    const squashed = mutations.reduce(
      (result, mutation) => result.concat(...mutation.mutations),
      [] as Mut[]
    )
    return new Mutation({mutations: squashed})
  }
}
