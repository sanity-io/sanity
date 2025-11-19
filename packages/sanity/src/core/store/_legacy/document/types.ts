import {type MutationPayload} from './buffered-doc/types'

/** @internal */
export interface MutationEvent {
  type: 'mutation'
  documentId: string
  transactionId: string
  mutations: MutationPayload[]
  effects: {apply: unknown; revert: unknown}

  previousRev: string
  resultRev: string
  transactionTotalEvents: number
  transactionCurrentEvent: number
  messageReceivedAt: string
  visibility: 'transaction' | 'query'

  transition: 'update' | 'appear' | 'disappear'
}

/** @internal */
export interface PendingMutationsEvent {
  type: 'pending'
  phase: 'begin' | 'end'
}

/** @internal */
export interface IdPair {
  draftId: string
  publishedId: string
  versionId?: string
}

export type {ReconnectEvent, ResetEvent, WelcomeBackEvent, WelcomeEvent} from '@sanity/client'
