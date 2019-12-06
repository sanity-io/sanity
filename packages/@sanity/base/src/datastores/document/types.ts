import {MutationPayload} from './buffered-doc/types'

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
