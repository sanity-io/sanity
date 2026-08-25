import {Observable} from 'rxjs'

export function abortSignalAsObservable(signal: AbortSignal): Observable<never> {
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
