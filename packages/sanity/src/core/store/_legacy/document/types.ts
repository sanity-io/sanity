import {MutationPayload} from './buffered-doc/types'

/** @internal */
export interface WelcomeEvent {
  type: 'welcome'
}

/** @internal */
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

/** @beta */
export interface ReconnectEvent {
  type: 'reconnect'
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
}
