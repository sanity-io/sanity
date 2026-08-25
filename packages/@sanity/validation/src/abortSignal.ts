import {Observable} from 'rxjs'

export function getAbortReason(signal: AbortSignal): unknown {
  return signal.reason === undefined
    ? new DOMException('The operation was aborted', 'AbortError')
    : signal.reason
}

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw getAbortReason(signal)
}

export function abortSignalAsObservable(signal: AbortSignal): Observable<never> {
  return new Observable((subscriber) => {
    const onAbort = () => subscriber.error(getAbortReason(signal))
    if (signal.aborted) {
      onAbort()
      return undefined
    }

    signal.addEventListener('abort', onAbort, {once: true})
    return () => signal.removeEventListener('abort', onAbort)
  })
}
