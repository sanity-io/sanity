import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {SettledFeatures} from '../../core/hooks/useFeatureEnabled'
import type {HasUsedScheduledPublishing} from '../../core/scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {missingProviderPromise} from './missingProviderPromise'

/**
 * @internal
 */
export interface ScheduledPublishingPromisesContextValue {
  featureEnabled: ObservablePromise<SettledFeatures>
  hasUsedScheduledPublishing: ObservablePromise<HasUsedScheduledPublishing>
}

/**
 * The two checks scheduled publishing availability depends on, as promises for `use()`.
 * `SchedulePublishingStudioProvider` starts them above the studio's loading screen boundary
 * (`studio.components.provider`) and `ScheduledPublishingEnabledProvider` reads them below, so
 * the layout and the navbar's tool list render once the answers are settled.
 *
 * @internal
 */
export const ScheduledPublishingPromisesContext =
  createContext<ScheduledPublishingPromisesContextValue>(
    'sanity/_singletons/context/scheduled-publishing-promises',
    {
      featureEnabled: missingProviderPromise(
        'ScheduledPublishingPromisesContext',
        'SchedulePublishingStudioProvider',
      ),
      hasUsedScheduledPublishing: missingProviderPromise(
        'ScheduledPublishingPromisesContext',
        'SchedulePublishingStudioProvider',
      ),
    },
  )
