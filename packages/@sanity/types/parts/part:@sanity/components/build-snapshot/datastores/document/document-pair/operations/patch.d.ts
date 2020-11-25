import {OperationArgs} from '../../types'
export declare const patch: {
  disabled: () => false
  execute: (
    {snapshots, idPair, draft, published, typeName}: OperationArgs,
    patches: any[],
    initialValue: any
  ) => void
}
