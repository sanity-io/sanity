import {use} from 'react'
import {TasksModePromiseContext} from 'sanity/_singletons'

import {type TasksMode} from './types'

/**
 * The tasks mode as a promise: `'default'` when the plan has the feature, `'upsell'` when it does
 * not, `null` when the feature check failed. Settles once the check has answered. Read it with
 * `use()` in the leaf that renders differently per mode, under a boundary close to that UI (the
 * sidebar, the document pane for its action); never on the studio's critical path, and never
 * awaited in an event handler.
 * @internal
 */
export function useTasksMode(): Promise<TasksMode> {
  const promise = use(TasksModePromiseContext)
  if (!promise) throw new TypeError('TasksModePromise: missing context value')
  return promise
}
