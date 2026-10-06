import {createContext} from 'sanity/_createContext'

/**
 * Whether scheduled publishing is enabled for the workspace, as a promise for `use()`, provided
 * by `SchedulePublishingStudioProvider`. Async because it depends on the feature check and on
 * whether the dataset has ever scheduled anything (unless the workspace opted in explicitly), so
 * it settles once both have answered. `null` where the plugin is not loaded;
 * `useScheduledPublishingEnabled()` reads that as disabled.
 * @internal
 */
export const ScheduledPublishingEnabledPromiseContext = createContext<Promise<boolean> | null>(
  'sanity/_singletons/context/scheduled-publishing-enabled-promise',
  null,
)
