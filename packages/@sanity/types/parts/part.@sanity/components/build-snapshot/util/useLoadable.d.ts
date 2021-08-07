import {Observable} from 'rxjs'
export declare type LoadableState<T> = LoadingState<T> | LoadedState<T> | ErrorState<T>
export interface LoadingState<T> {
  value: undefined
  error: undefined
  isLoading: true
}
export interface LoadedState<T> {
  value: T
  error: undefined
  isLoading: false
}
export interface ErrorState<T> {
  value: undefined
  error: Error
  isLoading: false
}
export declare function useLoadable<T>(observable$: Observable<T>): LoadableState<T>
export declare function useLoadable<T>(
  observable$: Observable<T>,
  initialValue: T
): LoadableState<T>
