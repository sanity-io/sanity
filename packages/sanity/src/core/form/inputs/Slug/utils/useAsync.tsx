import React from 'react'

export type AsyncCompleteState<T> = {
  status: 'complete'
  result: T
}
export type AsyncPendingState = {
  status: 'pending'
}
export type AsyncErrorState = {
  status: 'error'
  error: Error
}

export type AsyncState<T> = AsyncPendingState | AsyncCompleteState<T> | AsyncErrorState

/**
 * Takes an async function and returns a [AsyncState<value>, callback] pair.
 * Whenever the callback is invoked, a new AsyncState is returned.
 * If the returned callback is called again before the previous callback has settled, the resolution of the previous one will be ignored, thus preventing race conditions.
 * @param fn - an async function that returns a value
 * @param dependencies - list of dependencies that will return a new [value, callback] pair
 */
export function useAsync<T, U>(
  fn: (arg: U) => Promise<T>,
  dependencies: React.DependencyList
): [null | AsyncState<T>, (arg: U) => void] {
  const [state, setState] = React.useState<AsyncState<T> | null>(null)

  const lastId = React.useRef(0)

  const wrappedCallback = React.useCallback(
    (arg: U) => {
      const asyncId = ++lastId.current
      setState({status: 'pending'})

      Promise.resolve()
        .then(() => fn(arg))
        .then(
          (res) => {
            if (asyncId === lastId.current) {
              setState({status: 'complete', result: res})
            }
          },
          (err) => {
            if (asyncId === lastId.current) {
              setState({status: 'error', error: err})
            }
          }
        )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is under control, and enforced by our linter setup
    [fn, ...dependencies]
  )

  return [state, wrappedCallback]
}
