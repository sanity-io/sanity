import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export type ScheduledPublishingEnabledContextValue =
  | {
      enabled: false
      mode: null
    }
  | {
      enabled: true
      mode: 'default' | 'upsell'
    }

/**
 * Whether scheduled publishing is enabled and in which mode, as a promise for `use()`, provided
 * by `SchedulePublishingStudioProvider`. Both parts are async here: `enabled` depends on the
 * feature check and on whether the dataset has ever scheduled anything (unless the workspace
 * opted in explicitly), so it settles once both have answered. `null` where the plugin is not
 * loaded; `useScheduledPublishingEnabled()` reads that as disabled.
 * @internal
 */
export const ScheduledPublishingEnabledPromiseContext =
  createContext<Promise<ScheduledPublishingEnabledContextValue> | null>(
    'sanity/_singletons/context/scheduled-publishing-enabled-promise',
    null,
  )
