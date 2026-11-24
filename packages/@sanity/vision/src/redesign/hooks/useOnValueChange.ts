import {useEffect, useEffectEvent, useRef} from 'react'

/**
 * Calls `onChange` after a commit in which `value` differs from the one before, with both
 * values. Not called for the first render. With a `scope` (a tab id), a commit that changes the
 * scope takes the value as the new baseline without calling: the values before and after belong
 * to different things, so the difference between them is not a change of either.
 */
export function useOnValueChange<T>(
  value: T,
  onChange: (value: T, previous: T) => void,
  scope?: unknown,
): void {
  const handleChange = useEffectEvent(onChange)
  const previous = useRef({value, scope})
  useEffect(() => {
    const before = previous.current
    if (Object.is(before.value, value) && Object.is(before.scope, scope)) return
    previous.current = {value, scope}
    if (!Object.is(before.scope, scope)) return
    handleChange(value, before.value)
  }, [value, scope])
}
