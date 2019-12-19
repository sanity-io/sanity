import {OperationArgs} from '../../types'
import historyStore from 'part:@sanity/base/datastore/history'

export const restoreFrom = {
  disabled: ({snapshots}: OperationArgs) => false,
  execute: ({idPair, versions}: OperationArgs, fromId, fromRevision: string) => {
    return historyStore.restore(fromId, fromRevision).toPromise()
  }
}
