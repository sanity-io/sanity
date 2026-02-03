import {createContext} from 'sanity/_createContext'

import type {TasksEnabledContextValue} from '../../core/tasks/context/enabled/types'

// NOTE: We initialize this context with a default value (`enabled: false`)
// rather than `null` to handle cases where the tasks feature's availability
// isn't explicitly provided by a surrounding provider component. Typically,
// Tasks are included by default in all new Studio configurations. Therefore,
// in the absence of a specific provider (TasksEnabledProvider), we assume that
// the feature is disabled.
/**
 * @internal
 */
export const TasksEnabledContext = createContext<TasksEnabledContextValue>(
  'sanity/_singletons/context/tasks-enabled',
  {
    enabled: false,
    mode: null,
  },
)
