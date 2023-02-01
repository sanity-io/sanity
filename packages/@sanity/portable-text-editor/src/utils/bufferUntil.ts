import {EMPTY, Observable, OperatorFunction, defer, of, switchMap, tap} from 'rxjs'

export function bufferUntil<T>(
  emitWhen: (currentBuffer: T[]) => boolean
): OperatorFunction<T, T[]> {
  return (source: Observable<T>) =>
    defer(() => {
      let buffer: T[] = [] // custom buffer
      return source.pipe(
        tap((v) => buffer.push(v)), // add values to buffer
        switchMap(() => (emitWhen(buffer) ? of(buffer) : EMPTY)), // emit the buffer when the condition is met
        tap(() => (buffer = [])) // clear the buffer
      )
    })
}
