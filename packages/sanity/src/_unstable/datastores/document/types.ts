import {SanityClient} from '@sanity/client'
import {MutationPayload} from './buffered-doc/types'

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

  transactionTotalEvents: number
  transactionCurrentEvent: number

  transition: 'update' | 'appear' | 'disappear'
}

export interface ReconnectEvent {
  type: 'reconnect'
}

export interface PendingMutationsEvent {
  type: 'pending'
  phase: 'begin' | 'end'
}

export interface IdPair {
  draftId: string
  publishedId: string
}
