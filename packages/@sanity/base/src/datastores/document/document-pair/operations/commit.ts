import {OperationArgs} from '../../types'
import {merge} from 'rxjs'

export const commit = {
  disabled: (): false => false,
  execute: ({draft, published}: OperationArgs) => {
    return merge(draft.commit(), published.commit())
  },
}
