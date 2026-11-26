import {type MutationPayload} from '../../buffered-doc/types'
import {type MutationEvent} from '../../types'

export function mutationEvent({
  documentId = 'test',
  previousRev,
  resultRev,
  mutations = [],
  transition = 'update',
  messageReceivedAt = new Date().toISOString(),
  effects,
}: {
  documentId?: string
  previousRev: string
  resultRev: string
  mutations?: MutationPayload[]
  transition?: MutationEvent['transition']
  messageReceivedAt?: string
  /**
   * Content Lake's Mendoza effects. Left out by default, so the mutations are replayed: an effect
   * that does not match the mutations would make the event contradict itself.
   */
  effects?: MutationEvent['effects']
}): MutationEvent {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `effects` is left out unless given
  return {
    type: 'mutation',
    documentId,
    transactionId: resultRev,
    ...(effects ? {effects} : {}),
    mutations,
    previousRev: previousRev,
    resultRev: resultRev,
    messageReceivedAt,
    transition,
    transactionCurrentEvent: 1,
    transactionTotalEvents: 1,
    visibility: 'transaction',
  } as MutationEvent
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
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the listener omits `previousRev` here
  return event as MutationEvent
}
