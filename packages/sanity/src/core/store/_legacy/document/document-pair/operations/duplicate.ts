import {omit} from 'lodash'
import {getDraftId} from '../../../../../util'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {OperationImpl} from './types'

const omitProps = ['_createdAt', '_updatedAt']

export const duplicate: OperationImpl<[baseDocumentId: string], 'NOTHING_TO_DUPLICATE'> = {
  disabled: ({snapshots}) => {
    return snapshots.published || snapshots.draft ? false : 'NOTHING_TO_DUPLICATE'
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
      },
      {
        tag: 'document.duplicate',
      },
    )
  },
}
