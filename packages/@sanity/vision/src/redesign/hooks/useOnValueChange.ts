import {useEffect, useRef, useEffectEvent} from 'react'

/**
 * Calls `onChange` after a render in which `value` differs from the previous render, but not on
 * mount. Compares with `Object.is`, so pass a primitive (or a string key) for compound values.
 *
 * A change made while the component was hidden in an `<Activity>` boundary is not reported when
 * it is shown again, the way a remount would not report it: its effects did not run while hidden,
 * and a component that needs to catch up on being shown does so in its own mount effect.
 */
export function useOnValueChange<T>(value: T, onChange: (value: T, previous: T) => void): void {
  const handleChange = useEffectEvent(onChange)
  const previous = useRef(value)
  const hidden = useRef(false)

  useEffect(
    () => () => {
      hidden.current = true
    },
    [],
  )
  useEffect(() => {
    if (hidden.current) {
      hidden.current = false
      previous.current = value
      return
    }
    if (Object.is(previous.current, value)) return
    const before = previous.current
    previous.current = value
    handleChange(value, before)
  }, [value])
}
