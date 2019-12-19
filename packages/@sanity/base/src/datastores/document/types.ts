import {MutationPayload} from './buffered-doc/types'
import {SnapshotPair} from './document-pair/snapshotPair'
import {Id} from '@sanity/preview/lib/src/types'

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
  liveEdit: boolean
  typeName: string
  idPair: IdPair
  versions: SnapshotPair
  snapshots: {draft: null | SanityDocument; published: null | SanityDocument}
}
