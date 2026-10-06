import {use} from 'react'

import {type TasksMode} from './types'
import {useTasksModePromise} from './useTasksModePromise'

/**
 * The tasks mode. Suspends until the feature check has answered, so call it under a boundary
 * close to the UI that tells upsell from default (the sidebar), never on the studio's critical
 * path.
 * @internal
 */
export function useTasksMode(): TasksMode {
  return use(useTasksModePromise())
}
