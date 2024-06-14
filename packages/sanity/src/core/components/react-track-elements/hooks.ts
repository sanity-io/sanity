import {debounce} from 'lodash'
import {useLayoutEffect, useMemo, useReducer, useRef, useState} from 'react'

import {type IsEqualFunction} from './types'

/** @internal */
export interface TrackerContextStore<Value> {
  add: (id: string, value: Value) => void
  update: (id: string, value: Value) => void
  remove: (id: string) => void
}

function createStore<Value>(reportedValues: Map<string, Value>, publish: () => void) {
  /**
   * This implementation is over 4 years old, and is part of tackling a hard problem:
   * tracking the position of DOM nodes efficiently, so that Presence Sticky Overlays can render correctly and respond to scroll,
   * and so that Change Indicator connectors can draw paths that traces a document change to its form input field no matter how they layout shifts.
   * 4 years ago we didn't have a lot of options when solving this problem.
   * But today we have great success with using `@floating-ui/react` in `@sanity/ui` with a very similar problem: positioning tooltips and popovers correctly no matter how the page scrolls or the layout shifts.
   * We should consider migrating to `@floating-ui/react` for this problem as well.
   */
  function add(id: string, value: Value) {
    if (reportedValues.has(id)) {
      // eslint-disable-next-line no-console
      // console.error(
      //   new Error(
      //     `Invalid call to useReporter(${id}): A component reporting on "${id}" is already mounted in the subtree. Make sure that all reporters within the same <Tracker> subtree have unique ids.`
      //   )
      // )
    }
    reportedValues.set(id, value)
    publish()
  }

  function update(id: string, value: Value) {
    if (!reportedValues.has(id)) {
      // throw new Error(`A reporter with id "${id}" is not known.`)
    }
    reportedValues.set(id, value)
    publish()
  }

  function remove(id: string) {
    if (!reportedValues.has(id)) {
      // throw new Error(`A reporter with id "${id}" is not known`)
    }
    reportedValues.delete(id)
    publish()
  }

  return {
    add,
    remove,
    update,
  }
}

/** @internal */
export type TrackerContextGetSnapshot<Value> = [string, Value][]

/** @internal */
export function useTrackerStore<Value>(): {
  store: TrackerContextStore<Value>
  snapshot: TrackerContextGetSnapshot<Value>
} {
  const [reportedValues] = useState(() => new Map<string, Value>())
  const [snapshot, updateSnapshot] = useReducer(() => Array.from(reportedValues.entries()), [])
  const debouncedUpdateSnapshot = useMemo(() => debounce(updateSnapshot, 10, {trailing: true}), [])
  const store = useMemo(
    () => createStore(reportedValues, debouncedUpdateSnapshot),
    [debouncedUpdateSnapshot, reportedValues],
  )

  return {store, snapshot}
}

/** @internal */
export function useTrackerStoreReporter<Value>(
  store: TrackerContextStore<Value> | null,
  id: string | null,
  value: () => Value,
  isEqual: IsEqualFunction<Value> = Object.is,
): void {
  const idRef = useRef<string | null>(null)
  const previousRef = useRef<Value | null>(null)

  useLayoutEffect(() => {
    /**
     * Setup and teardown, only runs if `id`, `store` or the `value` getter changes
     */
    if (id === null || store === null) {
      return undefined
    }
    const nextValue = value()
    store.add(id, nextValue)
    idRef.current = id
    previousRef.current = nextValue
    return () => {
      store.remove(id)
      idRef.current = null
      previousRef.current = null
    }
  }, [id, store, value])

  useLayoutEffect(() => {
    /**
     * Runs after every render in case the result of calling `value` has changes that
     * the `isEqual` function picks up on.
     * @TODO This is a bit expensive, and we should migrate to using a library like `@floating-ui/react` instead of rolling our own solution.
     */
    if (id === null || idRef.current === null || store === null || id !== idRef.current) {
      return undefined
    }
    const nextValue = value()
    if (isEqual(previousRef.current, nextValue)) {
      return undefined
    }

    store.update(id, nextValue)
    previousRef.current = nextValue

    return undefined
  })
}
