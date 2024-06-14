/* eslint-disable no-console */
import {debounce} from 'lodash'
import {useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState} from 'react'

import {type IsEqualFunction} from './types'

/** @internal */
export interface TrackerContextStore<Value> {
  add: (id: string, value: Value) => void
  update: (id: string, value: Value) => void
  remove: (id: string) => void
}

function createStore<Value>(reportedValues: Map<string, Value>, publish: () => void) {
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

  useEffect(() => {
    console.log('useTrackerStore.useEffect')
  }, [])

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
      console.log('useTrackerStoreReporter.add', 'id is null')
      return undefined
    }
    console.groupCollapsed(`useTrackerStoreReporter.add(${id})`)
    console.count(id)
    const nextValue = value()
    console.log({current: nextValue})
    console.log('previous.current', previousRef.current)
    store.add(id, nextValue)
    idRef.current = id
    previousRef.current = nextValue
    console.groupEnd()
    return () => {
      console.count(`useTrackerStoreReporter.remove(${id})`)
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
      console.count(
        `useTrackerStoreReporter.update(${idRef.current || 'null'}, ${id || 'null'}): skipped`,
      )
      return undefined
    }
    const nextValue = value()
    if (isEqual(previousRef.current, nextValue)) {
      console.count(
        `useTrackerStoreReporter.update(${idRef.current || 'null'}, ${id || 'null'}): skipped, equal state`,
      )
      return undefined
    }

    console.group(`useTrackerStoreReporter.update(${id})`)
    store.update(id, nextValue)
    console.count(`update(id: ${id}, current: ${nextValue})`)
    console.log({'previous.current': previousRef.current, 'current': nextValue})
    console.groupEnd()

    previousRef.current = nextValue

    return undefined
  })
}

/** @internal */
export function useTrackerStoreReportedValues<Value>(
  snapshot: TrackerContextGetSnapshot<Value> | null,
): [string, Value][] {
  useEffect(() => {
    console.log('useTrackerStoreReportedValues.useEffect', {snapshot})
  }, [snapshot])

  return snapshot || []
}
