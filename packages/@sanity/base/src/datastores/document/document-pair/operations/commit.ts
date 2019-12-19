import {OperationArgs} from '../../types'
import {merge} from 'rxjs'

export const commit = {
  disabled: () => false,
  execute: ({versions}: OperationArgs) => {
    return merge(versions.draft.commit(), versions.published.commit()).toPromise()
  }
}
