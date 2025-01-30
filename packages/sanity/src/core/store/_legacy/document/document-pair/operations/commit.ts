import {EMPTY} from 'rxjs'

import {type OperationImpl} from './types'

export const commit: OperationImpl = {
  disabled: (): false => false,
  execute: ({draft, published, version}) => {
    version?.commit()
    draft.commit()
    published.commit()
    // note: we might be able to connect with the outgoing commit request stream here
    return EMPTY
  },
}
