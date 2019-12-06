import {Observable} from 'rxjs'
import {SanityDocument} from '../types'

export type CommitFunction = (mutation: MutationPayload) => Observable<unknown>

export interface DocumentRebaseEvent {
  type: 'rebase'
  document: SanityDocument
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

// HTTP API Mutation payloads
// Note: this is *not* the same as the Mutation helper class exported by @sanity/mutator
export interface MutationPayload {
  create?: any
  createIfNotExists?: any
  createOrReplace?: any
  delete?: any
  patch?: any
}
