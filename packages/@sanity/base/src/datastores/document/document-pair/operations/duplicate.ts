import {OperationArgs} from '../../types'
import {getDraftId} from '../../../../util/draftUtils'
import uuid from '@sanity/uuid'
import client from 'part:@sanity/base/client'
import {omit} from 'lodash'

const id = <T>(id: T): T => id

export const duplicate = {
  disabled: ({snapshots}: OperationArgs) => {
    const isDocument = snapshots.published || snapshots.draft
    if (!isDocument) {
      return 'TODO' // TODO: Return something meaningful here
    }
    return false
  },
  execute: ({snapshots}: OperationArgs, prepare = id) => {
    const omitProps = ['_id', '_createdAt', '_updatedAt']
    const source = snapshots.draft || snapshots.published
    return client.create({_id: getDraftId(uuid()), ...omit(prepare(source), omitProps)})
  }
}
