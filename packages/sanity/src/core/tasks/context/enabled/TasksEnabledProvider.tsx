import {use, useContext, useMemo} from 'react'
import {TasksEnabledContext, TasksFeaturesPromiseContext} from 'sanity/_singletons'

import {useWorkspace} from '../../../studio/workspace'
import {type TasksEnabledContextValue} from './types'

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * Decides whether tasks are available before anything below it renders. `TasksStudioLayout`,
 * `TasksStudioNavbar` and `TasksStudioActiveToolLayout` render a different tree depending on
 * `enabled`, so an answer that arrived after the first paint remounted the whole studio under
 * them. The feature check is a promise started by `TasksStudioProviders` above the studio's
 * loading screen boundary; reading it here suspends up to that screen until it is settled.
 *
 * @internal
 */
export function TasksEnabledProvider({children}: TaksEnabledProviderProps) {
  const featuresPromise = useContext(TasksFeaturesPromiseContext)
  if (!featuresPromise) {
    throw new Error(
      'TasksEnabledProvider: no TasksFeaturesPromiseContext above it. The tasks plugin registers `TasksStudioProviders` as `studio.components.providers` to provide it.',
    )
  }
  const {enabled, error} = use(featuresPromise)

  const isWorkspaceEnabled = useWorkspace().tasks?.enabled

  const value: TasksEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || error) {
      return {
        enabled: false,
        mode: null,
      }
    }
    return {
      enabled: true,
      mode: enabled ? 'default' : 'upsell',
    }
  }, [enabled, isWorkspaceEnabled, error])

  return <TasksEnabledContext.Provider value={value}>{children}</TasksEnabledContext.Provider>
}
