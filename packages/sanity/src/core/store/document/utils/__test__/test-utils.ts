import {type MutationPayload} from '../../buffered-doc/types'
import {type MutationEvent} from '../../types'

export function mutationEvent({
  documentId = 'test',
  previousRev,
  resultRev,
  mutations = [],
  transition = 'update',
  messageReceivedAt = new Date().toISOString(),
}: {
  documentId?: string
  previousRev: string
  resultRev: string
  mutations?: MutationPayload[]
  transition?: MutationEvent['transition']
  messageReceivedAt?: string
}): MutationEvent {
  return {
    type: 'mutation',
    documentId,
    transactionId: resultRev,
    effects: {revert: [], apply: []},
    mutations,
    previousRev: previousRev,
    resultRev: resultRev,
    messageReceivedAt,
    transition,
    transactionCurrentEvent: 1,
    transactionTotalEvents: 1,
    visibility: 'transaction',
  }
}

/**
 * The event for the mutation that creates a document. The listener sends it without a
 * `previousRev`, which the `MutationEvent` type has no room for.
 */
export function creationEvent({
  documentId = 'test',
  resultRev,
  messageReceivedAt,
}: {
  documentId?: string
  resultRev: string
  messageReceivedAt?: string
}): MutationEvent {
  const {previousRev: _previousRev, ...event} = mutationEvent({
    documentId,
    previousRev: '',
    resultRev,
    transition: 'appear',
    messageReceivedAt,
  })
  return event as MutationEvent
}
