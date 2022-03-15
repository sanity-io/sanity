import {omit} from 'lodash'
import {SanityDocument} from '@sanity/client'
import {OperationArgs} from '../../types'
import {getDraftId} from '../../../../util/draftUtils'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

const omitProps = ['_createdAt', '_updatedAt']

export const duplicate = {
  disabled: ({snapshots}: OperationArgs): 'NOTHING_TO_DUPLICATE' | false => {
    return snapshots.published || snapshots.draft ? false : 'NOTHING_TO_DUPLICATE'
  },
  execute: (
    {client, schema, snapshots, typeName}: OperationArgs,
    dupeId: string
  ): Promise<SanityDocument> => {
    const source = snapshots.draft || snapshots.published

    if (!source) {
      throw new Error('cannot execute on empty document')
    }

    return client.create(
      {
        ...omit(source, omitProps),
        _id: isLiveEditEnabled(schema, typeName) ? dupeId : getDraftId(dupeId),
        _type: source._type,
      },
      {
        tag: 'document.duplicate',
      }
    )
  },
}
