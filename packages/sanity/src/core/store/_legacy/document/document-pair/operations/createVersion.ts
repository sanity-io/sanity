import {omit} from 'lodash'

import {type OperationImpl, type VersionOriginTypes} from './types'

const omitProps = ['_createdAt', '_updatedAt']

export const createVersion: OperationImpl<
  [baseDocumentId: string, origin?: VersionOriginTypes],
  'NO_NEW_VERSION'
> = {
  disabled: ({snapshots}) => {
    return snapshots.published || snapshots.draft ? false : 'NO_NEW_VERSION'
  },
  execute: (
    {schema, client, snapshots, typeName},
    ...extra: [documentId: string, origin: VersionOriginTypes]
  ) => {
    const [documentId, origin] = extra
    const sourceMap = {
      version: snapshots.version,
      draft: snapshots.draft,
      published: snapshots.published,
    }

    const source = sourceMap[origin] || snapshots.draft || snapshots.published

    if (!source) {
      throw new Error('cannot execute on empty document')
    }

    return client.observable.create(
      {
        ...omit(source, omitProps),
        // we don't need to get a draft id or check live editing, we'll always want to create a new version based on the dupeId
        // we have guardrails for this on the front
        _id: documentId,
        _type: source._type,
      },
      {
        tag: 'document.createVersion',
      },
    )
  },
}
