import {type SanityDocument} from '@sanity/types'
import {omit} from 'lodash'

import {getDraftId, getVersionFromId, getVersionId} from '../../../../../util'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {operationsApiClient} from '../utils/operationsApiClient'
import {type OperationImpl} from './types'

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

export const duplicate: OperationImpl<[baseDocumentId: string], 'NOTHING_TO_DUPLICATE'> = {
  disabled: ({snapshots}) => {
    return snapshots.published || snapshots.draft || snapshots.version
      ? false
      : 'NOTHING_TO_DUPLICATE'
  },
  execute: ({schema, client, snapshots, typeName, idPair}, dupeId) => {
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
      {
        ...omit(source, omitProps),
        _id,
        _type: source._type,
      },
      {
        tag: 'document.duplicate',
      },
    )
  },
}
