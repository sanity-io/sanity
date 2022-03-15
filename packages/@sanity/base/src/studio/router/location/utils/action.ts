import {Observable, Subject} from 'rxjs'

export interface ActionFunctor<T> {
  call: (arg: T) => {progress: Observable<unknown>} | undefined
  calls: Observable<ActionCall<T>>
}

export interface ActionCall<T> {
  name: string
  progress?: Observable<unknown>
  returnValue?: {progress: Observable<unknown>}
  argument: T
}

export function createAction<T>(
  name: string,
  fn: (argument: T) => {progress: Observable<unknown>} | undefined
): ActionFunctor<T> {
  const callsSubject = new Subject<ActionCall<T>>()

  return {
    call(argument: T) {
      const returnValue = fn(argument)

      callsSubject.next({
        name,
        progress: returnValue?.progress,
        returnValue,
        argument,
      })

      return returnValue
    },

    calls: callsSubject.asObservable(),
  }
}
