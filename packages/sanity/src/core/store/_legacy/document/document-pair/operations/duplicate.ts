import {omit} from 'lodash'

import {getDraftId, getVersionFromId, getVersionId} from '../../../../../util'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {type OperationImpl} from './types'

const omitProps = ['_createdAt', '_updatedAt']

export const duplicate: OperationImpl<[baseDocumentId: string], 'NOTHING_TO_DUPLICATE'> = {
  disabled: ({snapshots}) => {
    if (snapshots.version) return false
    return snapshots.published || snapshots.draft || snapshots.version
      ? false
      : 'NOTHING_TO_DUPLICATE'
  },
  execute: ({schema, client, snapshots, typeName}, dupeId) => {
    const source = snapshots.version || snapshots.draft || snapshots.published

    if (!source) {
      throw new Error('cannot execute on empty document')
    }

    // When duplicating a version document we need to create it with a version id
    const versionId = snapshots.version?._id ? getVersionFromId(snapshots.version._id) : null
    // eslint-disable-next-line no-nested-ternary
    const _id = versionId
      ? getVersionId(dupeId, versionId)
      : isLiveEditEnabled(schema, typeName)
        ? dupeId
        : getDraftId(dupeId)

    return client.observable.create(
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
