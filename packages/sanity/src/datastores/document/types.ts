import {SanityClient} from '@sanity/client'
import {SanityDocument, Schema} from '@sanity/types'
import {HistoryStore} from '../history'
import {MutationPayload} from './buffered-doc/types'
import {DocumentVersionSnapshots} from './document-pair/snapshotPair'

export type {SanityClient} from '@sanity/client'
export type {MutationPayload as Mutation}

export interface WelcomeEvent {
  type: 'welcome'
}

export interface MutationEvent {
  type: 'mutation'
  documentId: string
  transactionId: string
  mutations: MutationPayload[]
  effects: {apply: unknown; revert: unknown}
  transition: 'update' | 'appear' | 'disappear'
}

export interface ReconnectEvent {
  type: 'reconnect'
}

export interface IdPair {
  draftId: string
  publishedId: string
}

// eslint-disable-next-line no-unused-vars
// export interface Operation<Args> {
//   disabled: (args: OperationArgs) => false | string
//   execute: (args: OperationArgs) => void
// }

export interface OperationArgs {
  client: SanityClient
  historyStore: HistoryStore
  schema: Schema
  typeName: string
  idPair: IdPair
  snapshots: {draft: null | SanityDocument; published: null | SanityDocument}
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}
