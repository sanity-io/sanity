import {OperationArgs} from '../../types'

export const discardDraft = {
  disabled: ({snapshots}: OperationArgs) => !snapshots.published || !snapshots.draft,
  execute: ({versions}: OperationArgs) => {
    versions.draft.delete()
  }
}
