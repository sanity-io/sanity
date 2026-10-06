import {use} from 'react'
import {ScheduledPublishingModePromiseContext} from 'sanity/_singletons'

import {type ScheduledPublishingMode} from './types'

/**
 * Already settled, so `use()` reads it without suspending and `await` resolves on the next
 * microtask.
 */
const SETTLED_NO_MODE: Promise<ScheduledPublishingMode> = Object.assign(
  Promise.resolve<ScheduledPublishingMode>(null),
  {status: 'fulfilled' as const, value: null},
)

/**
 * The scheduled publishing mode as a promise: `'default'` when the plan has the feature,
 * `'upsell'` when it does not, `null` when the feature is not enabled for the workspace. Settles
 * with `useScheduledPublishingEnabled()`. Read it with `use()` in the leaf that renders
 * differently per mode, under a `Suspense` boundary, or await it in an event handler. Settled as
 * no mode when the plugin is not loaded.
 * @internal
 */
export function useScheduledPublishingMode(): Promise<ScheduledPublishingMode> {
  return use(ScheduledPublishingModePromiseContext) ?? SETTLED_NO_MODE
}
