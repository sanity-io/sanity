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

export function useAsyncCallback<T, U>(
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
    [fn, ...dependencies]
  )

  return [state, wrappedCallback]
}
