import {EMPTY} from 'rxjs'

import {type DocumentOperationImpl} from './types'

export const commit: DocumentOperationImpl = {
  disabled: (): false => false,
  execute: ({document}) => {
    document.commit()
    return EMPTY
  },
}
