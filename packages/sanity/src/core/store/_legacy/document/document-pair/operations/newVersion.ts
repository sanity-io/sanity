import {omit} from 'lodash'

import {getDraftId} from '../../../../../util'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {type OperationImpl} from './types'

const omitProps = ['_createdAt', '_updatedAt']

export const newVersion: OperationImpl<[baseDocumentId: string], 'NO_NEW_VERSION'> = {
  disabled: ({snapshots}) => {
    return snapshots.published || snapshots.draft ? false : 'NO_NEW_VERSION'
  },
  execute: ({schema, client, snapshots, typeName}, dupeId) => {
    const source = snapshots.draft || snapshots.published

    if (!source) {
      throw new Error('cannot execute on empty document')
    }

    return client.observable.create(
      {
        ...omit(source, omitProps),
        _id: isLiveEditEnabled(schema, typeName) ? dupeId : getDraftId(dupeId),
        _type: source._type,
        _version: {},
      },
      {
        tag: 'document.newVersion',
      },
    )
  },
}
