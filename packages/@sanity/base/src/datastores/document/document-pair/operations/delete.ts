import {OperationArgs} from '../../types'

export const del = {
  disabled: ({snapshots}) =>
    snapshots.draft || snapshots.published ? false : 'Document does not exist',
  execute: ({versions}: OperationArgs) => {
    versions.draft.delete()
    versions.published.delete()
  }
}
