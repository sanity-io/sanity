import {type MonoTypeOperatorFunction, Observable, takeUntil} from 'rxjs'

function abortSignalAsObservable(signal: AbortSignal): Observable<never> {
  return new Observable((subscriber) => {
    const onAbort = () => subscriber.error(signal.reason)
    if (signal.aborted) {
      onAbort()
      return undefined
    }

    signal.addEventListener('abort', onAbort, {once: true})
    return () => signal.removeEventListener('abort', onAbort)
  })
}

export function cancelWith<T>(signal?: AbortSignal): MonoTypeOperatorFunction<T> {
  return (source) => (signal ? source.pipe(takeUntil(abortSignalAsObservable(signal))) : source)
}
