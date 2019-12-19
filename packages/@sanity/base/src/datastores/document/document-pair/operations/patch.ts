import {OperationArgs} from '../../types'
import {omit} from 'lodash'

export const patch = {
  disabled: () => false,
  execute: ({liveEdit, snapshots, idPair, versions, typeName}: OperationArgs, patches = []) => {
    if (liveEdit) {
      // No drafting, patch and commit the published document
      versions.published.createIfNotExists({
        _id: idPair.publishedId,
        _type: typeName
      })
      versions.published.patch(patches)
    } else {
      versions.draft.createIfNotExists({
        ...omit(snapshots.published, '_updatedAt'),
        _id: idPair.draftId,
        _type: typeName
      })
      versions.draft.patch(patches)
    }
  }
}
