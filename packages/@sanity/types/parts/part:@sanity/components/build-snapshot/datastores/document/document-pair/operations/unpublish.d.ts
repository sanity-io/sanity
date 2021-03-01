import {OperationArgs} from '../../types'
export declare const unpublish: {
  disabled: ({snapshots, typeName}: OperationArgs) => false | 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED'
  execute: ({idPair, snapshots}: OperationArgs) => any
}
