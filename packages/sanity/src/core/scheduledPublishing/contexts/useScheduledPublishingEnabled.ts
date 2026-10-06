import {use} from 'react'
import {
  type ScheduledPublishingEnabledContextValue,
  ScheduledPublishingEnabledPromiseContext,
} from 'sanity/_singletons'

const DISABLED: ScheduledPublishingEnabledContextValue = {enabled: false, mode: null}

/**
 * Whether scheduled publishing is enabled for the workspace and in which mode. Suspends until the
 * feature check and the usage probe have answered; off when the plugin is not loaded, which the
 * navbar's tool menu relies on since it renders either way.
 * @internal
 */
export function useScheduledPublishingEnabled(): ScheduledPublishingEnabledContextValue {
  const promise = use(ScheduledPublishingEnabledPromiseContext)
  if (!promise) return DISABLED
  return use(promise)
}
