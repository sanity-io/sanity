import {MutationPayload} from './buffered-doc/types'
import {DocumentVersionSnapshots} from './document-pair/snapshotPair'

export {MutationPayload as Mutation}

export interface SanityDocument {
  _id: string
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
  mutations: MutationPayload[]
}

export interface ReconnectEvent {
  type: 'reconnect'
}

export interface IdPair {
  draftId: string
  publishedId: string
}

export type SanityClient = any

export interface Operation<Args> {
  disabled: (args: OperationArgs) => false | string
  execute: (args: OperationArgs) => void
}

export interface OperationArgs {
  typeName: string
  idPair: IdPair
  snapshots: {draft: null | SanityDocument; published: null | SanityDocument}
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}
