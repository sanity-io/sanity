import {OperationArgs} from '../../types'
export declare const del: {
  disabled: ({snapshots}: {snapshots: any}) => false | 'NOTHING_TO_DELETE'
  execute: ({idPair, typeName}: OperationArgs) => any
}
