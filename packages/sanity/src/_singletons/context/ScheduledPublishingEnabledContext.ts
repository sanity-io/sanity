import {createContext} from 'sanity/_createContext'

/**
 * Whether the workspace has scheduled publishing enabled, provided by the scheduled publishing
 * plugin's studio provider. `false` where the plugin is not loaded, which is what the code outside
 * the plugin (`StudioToolMenu`) reads. Whether the feature is in use is answered separately, by
 * `ScheduledPublishingModePromiseContext` and `HasUsedScheduledPublishingPromiseContext`.
 * @internal
 */
export const ScheduledPublishingEnabledContext = createContext<boolean>(
  'sanity/_singletons/context/scheduled-publishing-enabled',
  false,
)
