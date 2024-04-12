import {
  // eslint-disable-next-line no-restricted-imports
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {createStore} from './createStore'
import {createUseReporter, type IsEqualFunction} from './createUseReporter'
import {type Reported, type TrackerContext} from './types'

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

let id = 0
const getNextId = () => ++id

/** @internal */
export function createTrackerScope<Value>() {
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
    const store = useMemo(() => createStore<Value>(), [])
    return <Context.Provider value={store}>{props.children}</Context.Provider>
  }

  const useReporter = createUseReporter(Context)

  return {
    Tracker,
    useReportedValues,
    useReporter,
    useAutoIdReporter: (
      value: Value | (() => Value),
      isEqual: IsEqualFunction<Value> = Object.is,
    ) => useReporter(`element-${useRef(getNextId()).current}`, value, isEqual),
  }
}
