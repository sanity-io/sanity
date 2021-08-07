import {OperationArgs} from '../../types'
export declare const restore: {
  disabled: () => false
  execute: ({idPair, typeName}: OperationArgs, fromRevision: string) => any
}
