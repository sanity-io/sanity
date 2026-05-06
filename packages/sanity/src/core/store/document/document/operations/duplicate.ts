import {getPublishedId} from '@sanity/client/csm'
import {type SanityDocumentLike} from '@sanity/types'
import omit from 'lodash-es/omit.js'

import {getDraftId, getVersionId} from '../../../../util'
import {type MapDocument} from '../../document-pair/operations/types'
import {operationsApiClient} from '../../document-pair/utils/operationsApiClient'
import {type DocumentOperationImpl} from './types'

const omitProps = ['_createdAt', '_updatedAt']

const mapDocumentNoop: MapDocument = (document: SanityDocumentLike) => document

export const duplicate: DocumentOperationImpl<
  [
    baseDocumentId: string,
    options?: {
      mapDocument?: MapDocument
    },
  ],
  'NOTHING_TO_DUPLICATE'
> = {
  disabled: ({snapshot}) => {
    return snapshot ? false : 'NOTHING_TO_DUPLICATE'
  },
  execute: ({client, snapshot, target}, dupeId, {mapDocument = mapDocumentNoop} = {}) => {
    // TODO: This action could be moved to the duplicate documentAction instead of being here. It doesn't operate on the buffered document as the other actions.
    if (!snapshot) {
      throw new Error('cannot execute duplicate on empty document')
    }

    const _id =
      target.bundleId === 'drafts'
        ? getDraftId(dupeId)
        : target.bundleId === 'published'
          ? getPublishedId(dupeId)
          : getVersionId(dupeId, target.bundleId)

    return operationsApiClient(client).observable.create(
      // @ts-expect-error - TODO: fix this type error
      omit(
        // Performing `Omit` on a type that has an index signature causes the known properties to
        // be lost.
        // @ts-expect-error - TODO: fix this type error
        mapDocument({
          ...snapshot,
          _id,
          _type: snapshot._type,
        }),
        omitProps,
      ),
      {
        tag: 'document.duplicate',
      },
    )
  },
}
