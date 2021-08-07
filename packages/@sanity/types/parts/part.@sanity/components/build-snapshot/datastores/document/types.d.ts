import {MutationPayload} from './buffered-doc/types'
import {DocumentVersionSnapshots} from './document-pair/snapshotPair'
export {SanityClient} from '@sanity/client'
export {MutationPayload as Mutation}
export interface SanityDocument {
  _id: string
  _type: string
  _rev?: string
  _updatedAt?: string
  [field: string]: any
}
export interface WelcomeEvent {
  type: 'welcome'
}
export interface MutationEvent {
  type: 'mutation'
  documentId: string
  transactionId: string
  mutations: MutationPayload[]
  effects: {
    apply: unknown
    revert: unknown
  }
}
export interface ReconnectEvent {
  type: 'reconnect'
}
export interface IdPair {
  draftId: string
  publishedId: string
}
export interface Operation<Args> {
  disabled: (args: OperationArgs) => false | string
  execute: (args: OperationArgs) => void
}
export interface OperationArgs {
  typeName: string
  idPair: IdPair
  snapshots: {
    draft: null | SanityDocument
    published: null | SanityDocument
  }
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}
