import {getDraftId, isDraftId} from 'part:@sanity/base/util/draft-utils'
import client from 'part:@sanity/base/client'
import {checkoutPair} from './document-pair/checkoutPair'
import createDeprecatedAPIs from './_createDeprecatedAPIs'
import {IdPair} from './types'
import {listenQuery} from './listenQuery'
import {editStateOf} from './document-pair/editState'
import {editOpsOf} from './document-pair/editOps'
import {documentEventsFor} from './document-pair/documentEvents'

function getIdPairFromPublished(publishedId: string): IdPair {
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  return {publishedId, draftId: getDraftId(publishedId)}
}
// Todo: Flush / commit before publish

export default {
  ...createDeprecatedAPIs(client), // Todo: can be removed in ~january 2020
  checkoutPair: (idPair: IdPair) => checkoutPair(idPair),
  listenQuery,
  // todo: pairs instead?
  local: {
    editStateOf: (publishedId: string, type) =>
      editStateOf(getIdPairFromPublished(publishedId), type),
    editOpsOf: (publishedId: string, type) => editOpsOf(getIdPairFromPublished(publishedId), type),
    documentEventsFor: (publishedId: string) =>
      documentEventsFor(getIdPairFromPublished(publishedId))
  }
}
