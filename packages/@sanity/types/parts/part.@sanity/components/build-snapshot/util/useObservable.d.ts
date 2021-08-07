import {Observable} from 'rxjs'
export declare function useObservable<T>(observable$: Observable<T>): T | null
export declare function useObservable<T>(observable$: Observable<T>, initialValue: T): T
