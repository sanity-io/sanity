import {Mutation} from '@sanity/mutator'
import {SanityDocument} from '@sanity/types'

/** @internal */
export type CommitFunction = (mutation: Mutation['params']) => Promise<unknown>

/** @beta */
export interface DocumentRebaseEvent {
  type: 'rebase'
  document: SanityDocument
  remoteMutations: MutationPayload[]
  localMutations: MutationPayload[]
}

/** @beta */
export interface DocumentMutationEvent {
  type: 'mutation'
  document: SanityDocument
  mutations: MutationPayload[]
  origin: 'local' | 'remote'
}

/** @beta */
export interface SnapshotEvent {
  type: 'snapshot'
  document: SanityDocument
}

/** @beta */
export interface CommittedEvent {
  type: 'committed'
}

/** @beta */
export interface DocumentRemoteMutationEvent {
  type: 'remoteMutation'
  head: SanityDocument
  transactionId: string
  author: string
  timestamp: Date
  effects: {
    apply: unknown
    revert: unknown
  }
}

/** @beta */
export type RemoteSnapshotEvent = DocumentRemoteMutationEvent | SnapshotEvent

/** @beta */
// HTTP API Mutation payloads
// Note: this is *not* the same as the Mutation helper class exported by @sanity/mutator
export interface MutationPayload {
  create?: any
  createIfNotExists?: any
  createOrReplace?: any
  delete?: any
  patch?: any
}
