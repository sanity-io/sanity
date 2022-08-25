import {MutationPayload} from './buffered-doc/types'

export {SanityClient} from '@sanity/client'
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

export interface PublishEvent {
  type: 'publish'
  /**
   * Note: All clients will get 'received' and 'success' messages, while 'init', and 'submitted' is only received by the client who initiated the publish
   *
   * - 'init'       - a publish operation was initiated by the current client
   * - 'submitted'  - we successfully submitted a publish transaction
   * - 'received'   - we received a listener message about a publish transaction. There might be more messages waiting.
   * - 'success'    - publishing succeeded (i.e. we received all mutations from the publish transaction)
   */
  phase: 'init' | 'submitted' | 'received' | 'success'
}

export interface IdPair {
  draftId: string
  publishedId: string
}
