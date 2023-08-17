import {throttle} from 'lodash'
import type {ThrottleSettings} from 'lodash'
import {useMemo} from 'react'

/**
 * @internal
 *
 * @example
 * ```tsx
 * // First create a callback using React’s `useCallback` hook
 * const myCallback = useCallback(() => {
 *   // this is not throttled
 * }, [])
 *
 * // Then make a throttled version using the `useThrottledCallback` hook
 * const myThrottledCallback = useThrottledCallback(myCallback, 100)
 *
 * // Call the throttled callback
 * <Button onClick={myThrottledCallback} />
 * ```
 */
export function useThrottledCallback(
  callback: (...args: any[]) => any,
  wait: number,
  options: ThrottleSettings,
): (...args: any[]) => any {
  const throttledCallback = useMemo(
    () => throttle(callback, wait, options),
    [callback, options, wait],
  )

  return throttledCallback
}
