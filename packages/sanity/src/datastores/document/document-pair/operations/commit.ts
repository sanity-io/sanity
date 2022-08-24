import {merge} from 'rxjs'
import {OperationImpl} from './types'

export const commit: OperationImpl = {
  disabled: (): false => false,
  execute: ({draft, published}) => {
    return merge(draft.commit(), published.commit())
  },
}
