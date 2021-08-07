import {OperationArgs} from '../../types'
export declare const duplicate: {
  disabled: ({snapshots}: OperationArgs) => false | 'NOTHING_TO_DUPLICATE'
  execute: ({snapshots, typeName}: OperationArgs, dupeId: any) => any
}
