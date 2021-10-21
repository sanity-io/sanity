import {getDraftId, isDraftId} from '../../util/draftUtils'
import {versionedClient} from '../../client/versionedClient'
import {checkoutPair} from './document-pair/checkoutPair'
import createDeprecatedAPIs from './_createDeprecatedAPIs'
import {IdPair} from './types'
import {resolveTypeForDocument} from './resolveTypeForDocument'
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
  ...createDeprecatedAPIs(versionedClient), // Todo: can be removed in ~january 2020
  checkoutPair: (idPair: IdPair) => checkoutPair(idPair),
  listenQuery,
  resolveTypeForDocument,

  pair: {
    editState: (publishedId: string, type: string) => editState(getIdPairFromPublished(publishedId), type),

    editOperations: (publishedId: string, type: string) =>
      editOperations(getIdPairFromPublished(publishedId), type),

    documentEvents: (publishedId: string, type: string) =>
      documentEvents(getIdPairFromPublished(publishedId), type),

    validation: (publishedId: string, type: string) =>
      validation(getIdPairFromPublished(publishedId), type),

    operationEvents: (publishedId, type: string) =>
      operationEvents(getIdPairFromPublished(publishedId), type),

    consistencyStatus: (publishedId, type: string) =>
      consistencyStatus(getIdPairFromPublished(publishedId), type),
  },
}
