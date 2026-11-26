import {concat, defer, EMPTY, of, Subject, throwError} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {catchWithCount} from '../catchWithCount'

function createRestartableSource() {
  const connections: Subject<string>[] = []
  const source$ = defer(() => {
    const connection = new Subject<string>()
    connections.push(connection)
    return connection
  })
  return {
    connections,
    source$,
    current: () => connections[connections.length - 1],
  }
}

describe('catchWithCount', () => {
  it('forwards values and completes when the source never errors', () => {
    const values: string[] = []
    const errors: unknown[] = []
    const completed: boolean[] = []

    of('a', 'b')
      .pipe(
        catchWithCount(() => {
          throw new Error('selector should not run')
        }),
      )
      .subscribe({
        next: (value) => values.push(value),
        error: (error) => errors.push(error),
        complete: () => completed.push(true),
      })

    expect(values).toEqual(['a', 'b'])
    expect(errors).toEqual([])
    expect(completed).toEqual([true])
  })

  it('reports attempt 1 on the first error', () => {
    const attempts: number[] = []
    const values: string[] = []

    throwError(() => new Error('boom'))
      .pipe(
        catchWithCount((_error, attemptNo) => {
          attempts.push(attemptNo)
          return of('recovered')
        }),
      )
      .subscribe((value) => values.push(value))

    expect(attempts).toEqual([1])
    expect(values).toEqual(['recovered'])
  })

  it('increments the attempt number on consecutive source errors', () => {
    const {connections, source$, current} = createRestartableSource()
    const attempts: number[] = []
    const values: string[] = []

    source$
      .pipe(
        catchWithCount((_error, attemptNo, caught) => {
          attempts.push(attemptNo)
          return caught
        }),
      )
      .subscribe((value) => values.push(value))

    current().error(new Error('first'))
    current().error(new Error('second'))
    current().next('ok')
    current().complete()

    expect(connections).toHaveLength(3)
    expect(attempts).toEqual([1, 2])
    expect(values).toEqual(['ok'])
  })

  it('resets the attempt number after the source emits a value', () => {
    const {source$, current} = createRestartableSource()
    const attempts: number[] = []
    const values: string[] = []

    source$
      .pipe(
        catchWithCount((_error, attemptNo, caught) => {
          attempts.push(attemptNo)
          return caught
        }),
      )
      .subscribe((value) => values.push(value))

    current().next('ok')
    current().error(new Error('after success'))
    current().next('again')
    current().error(new Error('after another success'))
    current().next('done')

    expect(attempts).toEqual([1, 1])
    expect(values).toEqual(['ok', 'again', 'done'])
  })

  it('does not reset the attempt number for a recovered replacement value', () => {
    const {source$, current} = createRestartableSource()
    const attempts: number[] = []
    const values: string[] = []

    source$
      .pipe(
        catchWithCount((_error, attemptNo, caught) => {
          attempts.push(attemptNo)
          return concat(of(`recovered-${attemptNo}`), caught)
        }),
      )
      .subscribe((value) => values.push(value))

    current().error(new Error('first'))
    current().error(new Error('second'))
    current().next('ok')

    expect(attempts).toEqual([1, 2])
    expect(values).toEqual(['recovered-1', 'recovered-2', 'ok'])
  })

  it('resubscribes when the selector returns the caught source', () => {
    const {connections, source$, current} = createRestartableSource()
    const values: string[] = []

    source$
      .pipe(catchWithCount((_error, _attemptNo, caught) => caught))
      .subscribe((value) => values.push(value))

    current().next('first connection')
    current().error(new Error('drop'))
    current().next('second connection')

    expect(connections).toHaveLength(2)
    expect(values).toEqual(['first connection', 'second connection'])
  })

  it('keeps a separate attempt counter per subscription', () => {
    const source = new Subject<string>()
    const firstAttempts: number[] = []
    const secondAttempts: number[] = []

    source
      .pipe(
        catchWithCount((_error, attemptNo) => {
          firstAttempts.push(attemptNo)
          return EMPTY
        }),
      )
      .subscribe()

    source
      .pipe(
        catchWithCount((_error, attemptNo) => {
          secondAttempts.push(attemptNo)
          return EMPTY
        }),
      )
      .subscribe()

    source.error(new Error('boom'))

    expect(firstAttempts).toEqual([1])
    expect(secondAttempts).toEqual([1])
  })

  it('counts errors that originate in the recovery stream', () => {
    const attempts: number[] = []
    const values: string[] = []

    throwError(() => new Error('source'))
      .pipe(
        catchWithCount((_error, attemptNo) => {
          attempts.push(attemptNo)
          return attemptNo === 1 ? throwError(() => new Error('recovery')) : of('recovered')
        }),
      )
      .subscribe((value) => values.push(value))

    expect(attempts).toEqual([1, 2])
    expect(values).toEqual(['recovered'])
  })
})
