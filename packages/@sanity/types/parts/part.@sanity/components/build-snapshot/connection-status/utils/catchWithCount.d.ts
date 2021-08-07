import {Observable, OperatorFunction} from 'rxjs'
declare type Selector<T, K> = (
  error: any,
  attemptNo: number,
  caught: Observable<T>
) => Observable<K>
export declare function catchWithCount<T, K = T>(selector: Selector<T, K>): OperatorFunction<T, K>
export {}
