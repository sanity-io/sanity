import {useCallback, DependencyList} from 'react'

type CallbackFunction<T extends any[], R> = (...args: T) => R
export class PortableTextEditorError extends Error {
  cause: string

  constructor(message: string, cause: string) {
    super(message)
    this.name = 'PortableTextEditorError'
    this.cause = cause
  }
}

/**
 * Wraps a callback function in a try/catch block and logs any errors to telemetry
 * usage:
 * ``` ts
 * const callback = useCallbackWithTryCatch(
 *  functionToWrap,
 *  [dep1, dep2, ...],
 *  'callbackName',
 * )
 * ```
 * @internal
 */
export const useCallbackWithTryCatch = <T extends any[], R>(
  callback: CallbackFunction<T, R>,
  deps: DependencyList,
  fnName: string,
): CallbackFunction<T, R> => {
  return useCallback(
    (...args: T) => {
      try {
        return callback(...args)
      } catch (error) {
        // Propagate the error.
        throw new PortableTextEditorError(error.message, fnName)
      }
    },
    // Avoid adding the callback, as it will be unstable and cause unnecessary re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, fnName],
  )
}
