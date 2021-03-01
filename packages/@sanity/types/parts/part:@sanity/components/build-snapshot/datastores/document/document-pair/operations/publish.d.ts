import {OperationArgs} from '../../types'
export declare const publish: {
  disabled: ({
    typeName,
    snapshots,
  }: OperationArgs) => false | 'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES'
  execute: ({idPair, snapshots}: OperationArgs) => any
}
