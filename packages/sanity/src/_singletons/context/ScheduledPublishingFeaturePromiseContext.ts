import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'

/**
 * The scheduled publishing feature check as a promise for `use()`, provided by
 * `SchedulePublishingStudioProvider`.
 * @internal
 */
export const ScheduledPublishingFeaturePromiseContext =
  createContext<ObservablePromise<SettledFeatures> | null>(
    'sanity/_singletons/context/scheduled-publishing-feature-promise',
    null,
  )
