import {
  catchError,
  lastValueFrom,
  type Observable,
  of,
  tap,
  toArray,
} from 'rxjs'

export type NextEmission<T> = {kind: 'NEXT'; value: T}
export type ErrorEmission = {kind: 'ERROR'; error: unknown}
export type CompleteEmission = {kind: 'COMPLETE'}
export type Notification<T> = NextEmission<T> | ErrorEmission | CompleteEmission
export function collectNotifications<T>(observable: Observable<T>) {
  const emissions: Notification<T>[] = []
  const subscription = observable
    .pipe(
      tap({
        next: value => emissions.push({kind: 'NEXT', value}),
        error: error => emissions.push({kind: 'ERROR', error}),
        complete: () => emissions.push({kind: 'COMPLETE'}),
      }),
      catchError(error => {
        // console.log(new Date(), 'caught error', error)
        return of(null)
      }),
    )
    .subscribe()

  return {
    emissions,
    unsubscribe: () => subscription?.unsubscribe(),
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function allValuesFrom(observable: Observable<unknown>) {
  return lastValueFrom(observable.pipe(toArray()))
}
