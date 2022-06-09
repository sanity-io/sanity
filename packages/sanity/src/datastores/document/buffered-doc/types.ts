import {Mutation} from '@sanity/mutator'
import {SanityDocument} from '@sanity/types'

export type CommitFunction = (mutation: Mutation['params']) => Promise<unknown>

export interface DocumentRebaseEvent {
  type: 'rebase'
  document: SanityDocument
  remoteMutations: MutationPayload[]
  localMutations: MutationPayload[]
}

export interface DocumentMutationEvent {
  type: 'mutation'
  document: SanityDocument
  mutations: MutationPayload[]
  origin: 'local' | 'remote'
}

export interface SnapshotEvent {
  type: 'snapshot'
  document: SanityDocument
}

export interface CommittedEvent {
  type: 'committed'
}

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

export type RemoteSnapshotEvent = DocumentRemoteMutationEvent | SnapshotEvent

// HTTP API Mutation payloads
// Note: this is *not* the same as the Mutation helper class exported by @sanity/mutator
export interface MutationPayload {
  create?: any
  createIfNotExists?: any
  createOrReplace?: any
  delete?: any
  patch?: any
}
