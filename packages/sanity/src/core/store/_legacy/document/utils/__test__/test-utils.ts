import type {MutationPayload} from '../../buffered-doc/types'
import {type MutationEvent} from '../../types'

export function mutationEvent({
  previousRev,
  resultRev,
  mutations,
}: {
  previousRev: string
  resultRev: string
  mutations: MutationPayload[]
}): MutationEvent {
  return {
    type: 'mutation',
    documentId: 'test',
    transactionId: resultRev,
    effects: {revert: [], apply: []},
    mutations,
    previousRev: previousRev,
    resultRev: resultRev,
    transition: 'update',
    transactionCurrentEvent: 1,
    transactionTotalEvents: 1,
    visibility: 'transaction',
  }
}
