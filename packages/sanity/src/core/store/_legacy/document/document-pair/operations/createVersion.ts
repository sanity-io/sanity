import {omit} from 'lodash'

import {type OperationImpl} from './types'

const omitProps = ['_createdAt', '_updatedAt']

export const createVersion: OperationImpl<[baseDocumentId: string], 'NO_NEW_VERSION'> = {
  disabled: ({snapshots}) => {
    return snapshots.published || snapshots.draft ? false : 'NO_NEW_VERSION'
  },
  execute: ({schema, client, snapshots, typeName}, dupeId) => {
    const source = snapshots.version || snapshots.draft || snapshots.published

    if (!source) {
      throw new Error('cannot execute on empty document')
    }

    return client.observable.create(
      {
        ...omit(source, omitProps),
        // we don't need to get a draft id or check live editing, we'll always want to create a new version based on the dupeId
        // we have guardrails for this on the front
        _id: dupeId,
        _type: source._type,
      },
      {
        tag: 'document.createVersion',
      },
    )
  },
}
