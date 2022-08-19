import {EMPTY} from 'rxjs'
import {OperationArgs} from '../../types'

export const commit = {
  disabled: (): false => false,
  execute: ({draft, published}: OperationArgs) => {
    draft.commit()
    published.commit()
    return EMPTY
  },
}
