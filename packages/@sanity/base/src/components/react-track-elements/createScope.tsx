import * as React from 'react'
import {TrackerContext} from './types'
import {createUseReporter, IsEqualFunction} from './createUseReporter'
import {createStore} from './createStore'

const useReporterGuard = (id: string) => {
  throw new Error(
    `No context provided for reporter. Make sure that the component calling "useReporter(${id}, ...)", is wrapped in a <Tracker> element`
  )
}

const useReportedValueGuard = () => {
  throw new Error(
    'No context provided for reporter. Make sure that the component calling "useReportedValues()", is wrapped inside a <Tracker> element'
  )
}

const DEFAULT_CONTEXT: TrackerContext<unknown> = {
  add: useReporterGuard,
  update: useReporterGuard,
  remove: useReporterGuard,
  subscribe: useReportedValueGuard,
  read: useReportedValueGuard
}

let id = 0
const getNextId = () => ++id

export function createScope<Value>() {
  const Context = React.createContext(DEFAULT_CONTEXT as TrackerContext<Value>)

  function useReportedValues() {
    const context = React.useContext(Context)
    const [values, setValues] = React.useState(context.read())
    React.useLayoutEffect(() => {
      setValues(context.read())
      return context.subscribe(setValues)
    }, [])
    return values
  }

  function Tracker(props: {children: React.ReactNode}) {
    const store = React.useMemo(() => createStore<Value>(), [])
    return <Context.Provider value={store}>{props.children}</Context.Provider>
  }

  const useReporter = createUseReporter(Context)

  return {
    Tracker,
    useReportedValues,
    useReporter,
    useAutoIdReporter: (
      value: Value | (() => Value),
      isEqual: IsEqualFunction<Value> = Object.is
    ) => useReporter(`element-${React.useRef(getNextId()).current}`, value, isEqual)
  }
}
