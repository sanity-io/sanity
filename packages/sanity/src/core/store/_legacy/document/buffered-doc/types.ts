import {Mutation} from '@sanity/mutator'
import {SanityDocument} from '@sanity/types'

/** @internal */
export type CommitFunction = (mutation: Mutation['params']) => Promise<unknown>

/**
 * @hidden
 * @beta */
export interface DocumentRebaseEvent {
  type: 'rebase'
  document: SanityDocument
  remoteMutations: MutationPayload[]
  localMutations: MutationPayload[]
}

/**
 * @hidden
 * @beta */
export interface DocumentMutationEvent {
  type: 'mutation'
  document: SanityDocument
  mutations: MutationPayload[]
  origin: 'local' | 'remote'
}

/**
 * @hidden
 * @beta */
export interface SnapshotEvent {
  type: 'snapshot'
  document: SanityDocument
}

/**
 * @hidden
 * @beta */
export interface CommittedEvent {
  type: 'committed'
}

/**
 * @hidden
 * @beta */
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

/**
 * @hidden
 * @beta */
export type RemoteSnapshotEvent = DocumentRemoteMutationEvent | SnapshotEvent

/**
 * @hidden
 * @beta */
// HTTP API Mutation payloads
// Note: this is *not* the same as the Mutation helper class exported by @sanity/mutator
export interface MutationPayload {
  create?: any
  createIfNotExists?: any
  createOrReplace?: any
  delete?: any
  patch?: any
}
