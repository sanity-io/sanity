import {use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {TasksModePromiseContext} from 'sanity/_singletons'

import {type TasksMode} from './types'

/**
 * The tasks mode as a promise: `use()` it where suspending is acceptable, or await it in an
 * event handler.
 * @internal
 */
export function useTasksModePromise(): ObservablePromise<TasksMode> {
  const promise = use(TasksModePromiseContext)
  if (!promise) throw new TypeError('TasksModePromise: missing context value')
  return promise
}
