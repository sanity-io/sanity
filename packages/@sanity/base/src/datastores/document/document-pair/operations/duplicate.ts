import {OperationArgs} from '../../types'
import {getDraftId} from '../../../../util/draftUtils'
import client from 'part:@sanity/base/client'
import {omit} from 'lodash'

export const duplicate = {
  disabled: ({snapshots}: OperationArgs) => {
    return snapshots.published || snapshots.draft ? false : 'NOTHING_TO_DUPLICATE'
  },
  execute: ({snapshots}: OperationArgs, dupeId) => {
    const omitProps = ['_id', '_createdAt', '_updatedAt']
    const source = snapshots.draft || snapshots.published
    return client.observable.create({_id: getDraftId(dupeId), ...omit(source, omitProps)})
  }
}
