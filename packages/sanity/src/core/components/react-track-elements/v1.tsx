/* eslint-disable no-console */
import {debounce} from 'lodash'
import createPubsub, {type Subscriber} from 'nano-pubsub'
import {
  // eslint-disable-next-line no-restricted-imports
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import {type IsEqualFunction, type Reported, type ReporterHook} from './types'

/** @internal */
export interface TrackerContext<Value> {
  add: (id: string, value: Value) => void
  update: (id: string, value: Value) => void
  remove: (id: string) => void
  read: () => Reported<Value>[]
  subscribe: (subscriber: Subscriber<Reported<Value>[]>) => () => void
}

function isFunc<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function'
}

function safeRead<T>(value: T | (() => T)): T {
  return isFunc(value) ? value() : value
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => undefined

// Todo: consider memozing individual functions or move the context assertion/guard to a separate step.
let didWarn = false
const useReporterGuard = (id: string): void => {
  if (!didWarn) {
    // eslint-disable-next-line no-console
    console.warn(
      new Error(
        `No context provided for reporter. Make sure that the component calling "useReporter(${id}, ...)", is wrapped in a <Tracker> element`,
      ),
    )
  }
  didWarn = true
}

function useReportedValueGuard(): Reported<unknown>[] {
  if (!didWarn) {
    // eslint-disable-next-line no-console
    console.warn(
      new Error(
        'No context provided for reporter. Make sure that the component calling "useReportedValues()", is wrapped inside a <Tracker> element',
      ),
    )
  }
  didWarn = true
  return []
}

const useSubscribeGuard = () => {
  if (!didWarn) {
    // eslint-disable-next-line no-console
    console.warn(
      new Error(
        'No context provided for reporter. Make sure that the component calling "useReportedValues()", is wrapped inside a <Tracker> element',
      ),
    )
  }
  didWarn = true
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {}
}

const DEFAULT_CONTEXT: TrackerContext<unknown> = {
  add: useReporterGuard,
  update: useReporterGuard,
  remove: useReporterGuard,
  subscribe: useSubscribeGuard,
  read: useReportedValueGuard,
}

/** @internal */
export function createTrackerScope<Value>(): {
  Tracker: (props: {children: ReactNode}) => JSX.Element
  useReportedValues: () => Reported<Value>[]
  useReporter: ReporterHook<Value>
} {
  const Context = createContext(DEFAULT_CONTEXT as TrackerContext<Value>)

  function useReportedValues() {
    const context = useContext(Context)
    const [values, setValues] = useState(context.read())
    useLayoutEffect(() => {
      setValues(context.read())
      return context.subscribe(setValues)
    }, [context])
    return values
  }

  function Tracker(props: {children: ReactNode}) {
    const [store] = useState(() => createStore<Value>())
    return <Context.Provider value={store}>{props.children}</Context.Provider>
  }

  function useReporter(
    // No reporting will happen if id=null
    id: string | null,
    value: () => Value,
    isEqual: IsEqualFunction<Value> = Object.is,
  ) {
    const {add, update, remove} = useContext(Context)
    const previous = useRef<Value>()

    useLayoutEffect(() => {
      if (id === null) {
        console.log('useReporter.add', 'id is null')
        return noop
      }
      console.groupCollapsed(`useReporter.add(${id})`)
      console.count(id)
      const current = safeRead(value)
      console.log({current})
      console.log('previous.current', previous.current)
      add(id, current)
      previous.current = current
      console.groupEnd()
      return () => {
        console.count(`useReporter.remove(${id})`)
        remove(id)
      }
    }, [add, id, remove, value])

    useLayoutEffect(() => {
      const current = safeRead(value)
      if (
        typeof previous.current !== 'undefined' &&
        !isEqual(previous.current, current) &&
        id !== null
      ) {
        console.group(`useReporter.update(${id})`)
        update(id, current)
        console.count(`update(id: ${id}, current: ${current})`)
        console.log({'previous.current': previous.current, current})
        console.groupEnd()
      } else {
        console.count(`useReporter.update(${id || 'null'}): skipped`)
      }
      previous.current = current
    })
  }

  return {
    Tracker,
    useReportedValues,
    useReporter,
  }
}

function createStore<Value>() {
  const reportedValues = new Map<string, Value>()
  const {publish, subscribe} = createPubsub<Reported<Value>[]>()

  const debouncedPublish = debounce(publish, 10, {trailing: true})
  const read = () => Array.from(reportedValues.entries())

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
    debouncedPublish(read())
  }

  function update(id: string, value: Value) {
    if (!reportedValues.has(id)) {
      // throw new Error(`A reporter with id "${id}" is not known.`)
    }
    reportedValues.set(id, value)
    debouncedPublish(read())
  }

  function remove(id: string) {
    if (!reportedValues.has(id)) {
      // throw new Error(`A reporter with id "${id}" is not known`)
    }
    reportedValues.delete(id)
    debouncedPublish(read())
  }

  return {
    add,
    remove,
    update,
    read,
    subscribe,
  }
}
