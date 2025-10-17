import {type SanityDocument, type SanityDocumentLike} from '@sanity/types'
import {omit} from 'lodash'

import {getDraftId, getVersionFromId, getVersionId} from '../../../../../util/draftUtils'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {operationsApiClient} from '../utils/operationsApiClient'
import {type MapDocument, type OperationImpl} from './types'

const omitProps = ['_createdAt', '_updatedAt']

const getDocumentToDuplicateId = ({
  versionSnapshot,
  dupeId,
  liveEdit,
}: {
  versionSnapshot?: SanityDocument | null | undefined
  dupeId: string
  liveEdit: boolean
}) => {
  if (versionSnapshot) {
    // When duplicating a version document we need to create it with a version id.
    // We get the version from the snapshot id and create a new version id for the duplicate.
    const versionId = getVersionFromId(versionSnapshot._id)
    if (versionId) return getVersionId(dupeId, versionId)
  }

  if (liveEdit) {
    return dupeId
  }

  return getDraftId(dupeId)
}

const mapDocumentNoop: MapDocument = (document) => document

export const duplicate: OperationImpl<
  [
    baseDocumentId: string,
    options?: {
      mapDocument?: MapDocument
    },
  ],
  'NOTHING_TO_DUPLICATE'
> = {
  disabled: ({snapshots}) => {
    return snapshots.published || snapshots.draft || snapshots.version
      ? false
      : 'NOTHING_TO_DUPLICATE'
  },
  execute: (
    {schema, client, snapshots, typeName, idPair},
    dupeId,
    {mapDocument = mapDocumentNoop} = {},
  ) => {
    const source = snapshots.version || snapshots.draft || snapshots.published

    if (!source) {
      throw new Error('cannot execute on empty document')
    }

    const _id = getDocumentToDuplicateId({
      versionSnapshot: snapshots.version,
      dupeId,
      liveEdit: isLiveEditEnabled(schema, typeName),
    })

    return operationsApiClient(client, idPair).observable.create(
      omit(
        mapDocument({
          ...source,
          _id,
          _type: source._type,
        }),
        omitProps,
        // Performing `Omit` on a type that has an index signature causes the known properties to
        // be lost.
      ) as SanityDocumentLike,
      {
        tag: 'document.duplicate',
      },
    )
  },
}
