import {createContext} from 'sanity/_createContext'

/**
 * Whether the workspace has tasks enabled, as `TasksStudioProvider` provides it. Synchronous, so
 * the tasks UI can render before the feature check behind `TasksModePromiseContext` has answered.
 * Defaults to `false` so that a studio without the plugin shows no tasks UI.
 * @internal
 */
export const TasksEnabledContext = createContext<boolean>(
  'sanity/_singletons/context/tasks-enabled',
  false,
)
