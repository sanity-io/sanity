import {OperationArgs} from '../../types'
export declare const discardChanges: {
  disabled: ({snapshots}: OperationArgs) => false | 'NO_CHANGES' | 'NOT_PUBLISHED'
  execute: ({idPair}: OperationArgs) => any
}
