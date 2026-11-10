import {useEffect, useRef} from 'react'
import {useEffectEvent} from 'use-effect-event'

/**
 * Calls `onChange` after a render in which `value` differs from the previous render, but not on
 * mount. Compares with `Object.is`, so pass a primitive (or a string key) for compound values.
 */
export function useOnValueChange<T>(value: T, onChange: (value: T, previous: T) => void): void {
  const handleChange = useEffectEvent(onChange)
  const previous = useRef(value)

  useEffect(() => {
    if (Object.is(previous.current, value)) return
    const before = previous.current
    previous.current = value
    handleChange(value, before)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [value])
}
