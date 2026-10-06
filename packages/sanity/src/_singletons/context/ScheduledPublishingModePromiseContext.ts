import {createContext} from 'sanity/_createContext'

import type {ScheduledPublishingMode} from '../../core/scheduledPublishing/contexts/types'

/**
 * The scheduled publishing mode as a promise for `use()`, provided by
 * `SchedulePublishingStudioProvider`. Settles with the enabled promise: `'default'` or `'upsell'`
 * when the feature is enabled, `null` when it is not. `null` where the plugin is not loaded;
 * `useScheduledPublishingMode()` reads that as no mode.
 * @internal
 */
export const ScheduledPublishingModePromiseContext =
  createContext<Promise<ScheduledPublishingMode> | null>(
    'sanity/_singletons/context/scheduled-publishing-mode-promise',
    null,
  )
