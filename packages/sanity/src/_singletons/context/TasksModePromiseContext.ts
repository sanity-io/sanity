import {createContext} from 'sanity/_createContext'

import type {TasksMode} from '../../core/tasks/context/enabled/types'

/**
 * The tasks mode as a promise for `use()`, provided by `TasksStudioProvider`. Settles once the
 * tasks feature check has answered, so only the UI that tells upsell from default waits for it.
 * @internal
 */
export const TasksModePromiseContext = createContext<Promise<TasksMode> | null>(
  'sanity/_singletons/context/tasks-mode-promise',
  null,
)
