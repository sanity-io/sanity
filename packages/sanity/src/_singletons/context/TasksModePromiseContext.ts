import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {TasksMode} from '../../core/tasks/context/enabled/types'

/**
 * The tasks mode as a promise for `use()`, provided by `TasksStudioProvider`. Settles once the
 * tasks feature check has answered, so only the UI that tells upsell from default waits for it.
 * An `ObservablePromise` so `use()` reads an already settled mode without suspending.
 * @internal
 */
export const TasksModePromiseContext = createContext<ObservablePromise<TasksMode> | null>(
  'sanity/_singletons/context/tasks-mode-promise',
  null,
)
