import {EMPTY} from 'rxjs'
import {OperationImpl} from './types'

export const commit: OperationImpl<[transactionId?: string]> = {
  disabled: (): false => false,
  execute: ({draft, published}, transactionId?: string) => {
    draft.commit(transactionId)
    published.commit(transactionId)
    // todo: we might be able to connect with the outgoing commit request stream here
    return EMPTY
  },
}
