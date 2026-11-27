import {addTransitionType, startTransition, useEffect, useRef, useState} from 'react'

/**
 * `value` as it is shown: a change reaches it a render later, in a transition of the given types.
 * View transition boundaries that map only those types to a class then animate this change and no
 * other transition that happens to touch them. `immediate` returns `value` as it is, for a layout
 * that does not animate. `types` is compared by identity, so pass a constant.
 *
 * Changes made in the same render reach their shown values in the same transition, so several
 * values (a label and the control beside it) can move together.
 *
 * @internal
 */
export function useViewTransitionValue<T>(
  value: T,
  types: readonly string[],
  immediate = false,
): T {
  const [shown, setShown] = useState(value)
  // The last value handed to a transition. A change that reverts before its transition commits
  // still differs from this, so the revert is queued too. React renders transition updates of one
  // state together, so the first value never commits on its own. Comparing against `shown` would
  // skip the revert and let the pending first value land after it.
  const requested = useRef(value)
  useEffect(() => {
    if (immediate || Object.is(requested.current, value)) return
    requested.current = value
    // A transition type can only be added inside `startTransition`, so the change is committed
    // from here rather than through `useDeferredValue`.
    startTransition(() => {
      for (const type of types) addTransitionType(type)
      setShown(value)
    })
  }, [immediate, types, value])
  return immediate ? value : shown
}
