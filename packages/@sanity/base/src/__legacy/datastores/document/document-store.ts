import {getDraftId, isDraftId} from 'part:@sanity/base/util/draft-utils'
import client from 'part:@sanity/base/client'
import {checkoutPair} from './document-pair/checkoutPair'
import createDeprecatedAPIs from './_createDeprecatedAPIs'
import {IdPair} from './types'
import {listenQuery} from './listenQuery'
import {editState} from './document-pair/editState'
import {editOperations} from './document-pair/editOperations'
import {documentEvents} from './document-pair/documentEvents'
import {validation} from './document-pair/validation'
import {operationEvents} from './document-pair/operationEvents'
import {consistencyStatus} from './document-pair/consistencyStatus'

function getIdPairFromPublished(publishedId: string): IdPair {
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  return {publishedId, draftId: getDraftId(publishedId)}
}

export default {
  ...createDeprecatedAPIs(client), // Todo: can be removed in ~january 2020
  checkoutPair: (idPair: IdPair) => checkoutPair(idPair),
  listenQuery,

  pair: {
    editState: (publishedId: string, type) => editState(getIdPairFromPublished(publishedId), type),

    editOperations: (publishedId: string, type) =>
      editOperations(getIdPairFromPublished(publishedId), type),

    documentEvents: (publishedId: string) => documentEvents(getIdPairFromPublished(publishedId)),

    validation: (publishedId: string, typeName: string) =>
      validation(getIdPairFromPublished(publishedId), typeName),

    operationEvents: (publishedId, type) =>
      operationEvents(getIdPairFromPublished(publishedId), type),

    consistencyStatus: (publishedId) => consistencyStatus(getIdPairFromPublished(publishedId)),
  },
}
