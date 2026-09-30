import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'

/**
 * The tasks feature check as a promise for `use()`. `TasksStudioProviders` starts it above the
 * studio's loading screen boundary (`studio.components.providers`) and `TasksEnabledProvider`
 * reads it below, so the layout renders once the answer is settled. `null` outside the plugin.
 *
 * @internal
 */
export const TasksFeaturesPromiseContext = createContext<ObservablePromise<SettledFeatures> | null>(
  'sanity/_singletons/context/tasks-features-promise',
  null,
)
