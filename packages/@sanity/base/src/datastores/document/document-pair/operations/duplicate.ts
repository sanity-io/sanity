import {omit} from 'lodash'
import {versionedClient} from '../../../../client/versionedClient'
import {getDraftId} from '../../../../util/draftUtils'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {OperationImpl} from './types'

const omitProps = ['_createdAt', '_updatedAt']

export const duplicate: OperationImpl<[baseDocumentId: string], 'NOTHING_TO_DUPLICATE'> = {
  disabled: ({snapshots}) => {
    return snapshots.published || snapshots.draft ? false : 'NOTHING_TO_DUPLICATE'
  },
  execute: ({snapshots, typeName}, baseDocumentId) => {
    const source = snapshots.draft || snapshots.published
    return versionedClient.create(
      {
        ...omit(source, omitProps),
        _id: isLiveEditEnabled(typeName) ? baseDocumentId : getDraftId(baseDocumentId),
        _type: source._type,
      },
      {
        tag: 'document.duplicate',
      }
    )
  },
}
