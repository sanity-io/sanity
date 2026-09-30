import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'
import {missingProviderPromise} from './missingProviderPromise'

/**
 * The tasks feature check as a promise for `use()`. `TasksStudioProvider` starts it above the
 * studio's loading screen boundary (`studio.components.provider`) and `TasksEnabledProvider`
 * reads it below with `use(use(TasksFeaturesPromiseContext))`, so the layout renders once the
 * answer is settled.
 *
 * @internal
 */
export const TasksFeaturesPromiseContext = createContext<ObservablePromise<SettledFeatures>>(
  'sanity/_singletons/context/tasks-features-promise',
  missingProviderPromise('TasksFeaturesPromiseContext', 'TasksStudioProvider'),
)
