import {Observable} from 'rxjs'
export declare function memoize<T, Arg1>(
  fn: (arg1: Arg1) => Observable<T>,
  keyGen: (arg1: Arg1) => string
): (arg1: Arg1) => Observable<T>
export declare function memoize<T, Arg1, Arg2>(
  fn: (arg1: Arg1, arg2: Arg2) => Observable<T>,
  keyGen: (arg1: Arg1, arg2: Arg2) => string
): (arg1: Arg1, arg2: Arg2) => Observable<T>
export declare function memoize<T, Arg1, Arg2, Arg3>(
  fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3) => Observable<T>,
  keyGen: (arg1: Arg1, arg2: Arg2, arg3: Arg3) => string
): (arg1: Arg1, arg2: Arg2, arg3: Arg3) => Observable<T>
