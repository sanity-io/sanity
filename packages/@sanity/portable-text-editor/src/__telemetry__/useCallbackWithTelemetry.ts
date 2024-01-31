import {useCallback, DependencyList} from 'react'
import {useTelemetry} from '@sanity/telemetry/react'
import {isProd} from '../environment'
import {PortableTextEditorError} from './portable-text-editor.telemetry'

type CallbackFunction<T extends any[], R> = (...args: T) => R

/**
 * Wraps a callback function in a try/catch block and logs any errors to telemetry
 * usage:
 * ``` ts
 * const callback = useCallbackWithTelemetry(
 *  functionToWrap,
 *  [dep1, dep2, ...],
 *  'callbackName',
 * )
 * ```
 * @internal
 */
export const useCallbackWithTelemetry = <T extends any[], R>(
  callback: CallbackFunction<T, R>,
  deps: DependencyList,
  fnName: string,
): CallbackFunction<T, R> => {
  const telemetry = useTelemetry()
  return useCallback(
    (...args: T) => {
      try {
        return callback(...args)
      } catch (error) {
        console.error(error)
        if (isProd) {
          telemetry.log(PortableTextEditorError, {
            error,
            fnName,
            args,
          })
        }
        // Propagate the error to the caller
        throw error
      }
    },
    // Avoid adding the callback, as it will be unstable and cause unnecessary re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, fnName],
  )
}
