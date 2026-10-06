import {use} from 'react'
import {ScheduledPublishingEnabledPromiseContext} from 'sanity/_singletons'

/**
 * Already settled, so `use()` reads it without suspending and `await` resolves on the next
 * microtask.
 */
const SETTLED_DISABLED: Promise<boolean> = Object.assign(Promise.resolve(false), {
  status: 'fulfilled' as const,
  value: false,
})

/**
 * Whether scheduled publishing is enabled for the workspace, as a promise that settles once the
 * feature check and the usage probe have answered. Read it with `use()` in the leaf that renders
 * differently when enabled, under a `Suspense` boundary, or await it in an event handler. Settled
 * as disabled when the plugin is not loaded, which the navbar's tool menu relies on since it
 * renders either way.
 * @internal
 */
export function useScheduledPublishingEnabled(): Promise<boolean> {
  return use(ScheduledPublishingEnabledPromiseContext) ?? SETTLED_DISABLED
}
