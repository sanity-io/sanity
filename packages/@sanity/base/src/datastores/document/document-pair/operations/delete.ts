import {OperationArgs} from '../../types'
import {merge} from 'rxjs'

export const del = {
  disabled: ({snapshots}) =>
    snapshots.draft || snapshots.published ? false : 'Document does not exist',
  execute: ({versions}: OperationArgs) => {
    versions.draft.delete()
    versions.published.delete()
    return merge(versions.draft.commit(), versions.published.commit()).toPromise()
  }
}
