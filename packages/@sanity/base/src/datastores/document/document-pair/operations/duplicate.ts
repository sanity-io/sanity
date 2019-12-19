import {OperationArgs} from '../../types'
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
    let co = client.observable
    if (snapshots.draft) {
      co = co.create({_id: uuid(), ...omit(prepare(snapshots.draft), omitProps)})
    } else {
      co = co.create({_id: uuid(), ...omit(prepare(snapshots.published), omitProps)})
    }
    co.subscribe()
  }
}
