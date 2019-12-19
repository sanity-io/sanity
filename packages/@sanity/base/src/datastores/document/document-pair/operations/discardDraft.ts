import {OperationArgs} from '../../types'

export const discardDraft = {
  disabled: ({snapshots}: OperationArgs) => !snapshots.draft,
  execute: ({versions}: OperationArgs) => {
    versions.draft.delete()
  }
}
