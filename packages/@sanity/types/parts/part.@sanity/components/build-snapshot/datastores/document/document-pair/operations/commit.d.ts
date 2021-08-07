import {OperationArgs} from '../../types'
export declare const commit: {
  disabled: () => false
  execute: ({draft, published}: OperationArgs) => import('rxjs').Observable<never>
}
