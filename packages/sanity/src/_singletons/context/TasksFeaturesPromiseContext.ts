import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'

/**
 * The tasks feature check as a promise for `use()`, provided by `TasksStudioProvider`.
 * @internal
 */
export const TasksFeaturesPromiseContext = createContext<ObservablePromise<SettledFeatures> | null>(
  'sanity/_singletons/context/tasks-features-promise',
  null,
)
