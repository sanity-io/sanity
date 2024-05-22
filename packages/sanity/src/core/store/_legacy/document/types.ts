import {type MutationPayload} from './buffered-doc/types'

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
  visibility: 'transaction' | 'query'

  transition: 'update' | 'appear' | 'disappear'
}

/**
 * @hidden
 * @beta */
export interface ReconnectEvent {
  type: 'reconnect'
}

/** @internal */
export interface PendingMutationsEvent {
  type: 'pending'
  phase: 'begin' | 'end'
}

/** @internal */
// TODO: Rename -> `IdBundle`
export interface IdPair {
  draftIds: string[]
  // TODO: Rename -> `publicId`
  publishedId: string
}
