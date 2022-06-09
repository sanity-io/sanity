import {merge, Observable} from 'rxjs'
import {OperationArgs} from '../../types'

export const commit = {
  disabled: (): false => false,
  execute: ({draft, published}: OperationArgs): Observable<never> => {
    return merge(draft.commit(), published.commit())
  },
}
