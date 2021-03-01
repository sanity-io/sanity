import * as React from 'react'
import {TrackerContext} from './types'

export type ReporterHook<Payload> = (
  id: string | null,
  value: Payload | (() => Payload),
  isEqual?: (a: Payload, b: Payload) => boolean
) => void

function isFunc<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function'
}

function read<T>(value: T | (() => T)): T {
  return isFunc(value) ? value() : value
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => undefined

export type IsEqualFunction<Value> = (a: Value, b: Value) => boolean

export function createUseReporter<Value>(
  Context: React.Context<TrackerContext<Value>>
): ReporterHook<Value> {
  return function useReporter(
    // No reporting will happen if id=null
    id: string | null,
    value: Value | (() => Value),
    isEqual: IsEqualFunction<Value> = Object.is
  ) {
    const {add, update, remove} = React.useContext(Context)
    const previous = React.useRef<Value>()

    React.useLayoutEffect(() => {
      if (id === null) {
        return noop
      }
      const current = read(value)
      add(id, current)
      previous.current = current
      return () => {
        remove(id)
      }
    }, [add, id, remove, value])

    React.useLayoutEffect(() => {
      const current = read(value)
      if (
        typeof previous.current !== 'undefined' &&
        !isEqual(previous.current, current) &&
        id !== null
      ) {
        update(id, current)
      }
      previous.current = current
    })
  }
}
