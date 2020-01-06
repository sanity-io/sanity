import {OperationArgs} from '../../types'

export const discardDraft = {
  disabled: ({snapshots}: OperationArgs) => {
    if (!snapshots.draft) {
      return 'This document has no unpublished changes'
    }
    if (!snapshots.published) {
      return 'This document is not published'
    }
    return false
  },
  execute: ({versions}: OperationArgs) => {
    versions.draft.delete()
    return versions.draft.commit().toPromise()
  }
}
