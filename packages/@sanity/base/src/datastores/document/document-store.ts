import type {Observable} from 'rxjs'
import {getDraftId, isDraftId} from '../../util/draftUtils'
import {versionedClient} from '../../client/versionedClient'
import type {DocumentVersionEvent, Pair} from './document-pair/checkoutPair'
import {checkoutPair} from './document-pair/checkoutPair'
import createDeprecatedAPIs from './_createDeprecatedAPIs'
import type {IdPair} from './types'
import {resolveTypeForDocument} from './resolveTypeForDocument'
import {listenQuery} from './listenQuery'
import type {EditStateFor} from './document-pair/editState'
import {editState} from './document-pair/editState'
import {editOperations} from './document-pair/editOperations'
import {documentEvents} from './document-pair/documentEvents'
import type {ValidationStatus} from './document-pair/validation'
import {validation} from './document-pair/validation'
import {operationEvents} from './document-pair/operationEvents'
import {consistencyStatus} from './document-pair/consistencyStatus'
import type {OperationError, OperationSuccess} from './document-pair/operationEvents'
import type {OperationsAPI} from './document-pair/operations'

function getIdPairFromPublished(publishedId: string): IdPair {
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  return {publishedId, draftId: getDraftId(publishedId)}
}

export default {
  ...createDeprecatedAPIs(versionedClient), // Todo: can be removed in ~january 2020
  checkoutPair: (idPair: IdPair): Pair => checkoutPair(idPair),
  listenQuery,
  resolveTypeForDocument,

  pair: {
    editState: (publishedId: string, type: string): Observable<EditStateFor> =>
      editState(getIdPairFromPublished(publishedId), type),

    editOperations: (publishedId: string, type: string): Observable<OperationsAPI> =>
      editOperations(getIdPairFromPublished(publishedId), type),

    documentEvents: (publishedId: string, type: string): Observable<DocumentVersionEvent> =>
      documentEvents(getIdPairFromPublished(publishedId), type),

    validation: (publishedId: string, type: string): Observable<ValidationStatus> =>
      validation(getIdPairFromPublished(publishedId), type),

    operationEvents: (
      publishedId: string,
      type: string
    ): Observable<OperationSuccess | OperationError> =>
      operationEvents(getIdPairFromPublished(publishedId), type),

    consistencyStatus: (publishedId: string, type: string): Observable<boolean> =>
      consistencyStatus(getIdPairFromPublished(publishedId), type),
  },
}
