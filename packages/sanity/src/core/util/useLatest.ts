import {useEffect, useRef} from 'react'

/**
 * Returns a stable container whose `current` always holds the value from the
 * latest committed render.
 *
 * Exists for RxJS pipelines that are memoized once per component but must call
 * an unstable callback prop at event time. Reading a `useRef` created in the
 * component from inside the pipeline closure trips `react/refs` and makes the
 * React Compiler skip the component (static analysis cannot prove operator
 * callbacks run outside render), while `react-hooks/rules-of-hooks` forbids
 * calling a `useEffectEvent` function from render-scope closures altogether.
 * Subscription callbacks reading `current` only ever run after commit, where
 * ref access is sound.
 *
 * @internal
 */
export function useLatest<T>(value: T): {readonly current: T} {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}
