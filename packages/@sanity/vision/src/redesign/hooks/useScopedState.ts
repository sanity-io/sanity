import {type Dispatch, type SetStateAction, useCallback, useState} from 'react'

interface ScopedState<T> {
  scope: unknown
  value: T
}

function initial<T>(initialValue: T | (() => T)): T {
  return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
}

/**
 * `useState` for a value that belongs to a scope (a tab id): when the scope changes, the state
 * starts over from `initialValue` in that same render, as it would if the component had been
 * mounted anew for the scope. The setter is stable, like `useState`'s, and an update always
 * lands in the current scope, so use this for state that only user actions change (an open
 * bar, a pane picked on a phone); state a request settles into belongs in a component keyed
 * on the scope, where an update for an earlier scope is dropped with the unmounted instance.
 */
export function useScopedState<T>(
  scope: unknown,
  initialValue: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<ScopedState<T>>(() => ({
    scope,
    value: initial(initialValue),
  }))
  const current = Object.is(state.scope, scope) ? state : {scope, value: initial(initialValue)}
  if (current !== state) setState(current)

  const setValue = useCallback(
    (update: SetStateAction<T>) =>
      setState((previous) => {
        const value =
          typeof update === 'function' ? (update as (previous: T) => T)(previous.value) : update
        return Object.is(value, previous.value) ? previous : {scope: previous.scope, value}
      }),
    [],
  )
  return [current.value, setValue]
}
