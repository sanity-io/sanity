import {EMPTY} from 'rxjs'
import {OperationArgs} from '../../types'

export const commit = {
  disabled: (): false => false,
  execute: ({draft, published}: OperationArgs) => {
    draft.commit()
    published.commit()
    // todo: we might be able to connect with the outgoing commit request stream here
    return EMPTY
  },
}
