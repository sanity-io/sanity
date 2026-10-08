import {createContext} from 'sanity/_createContext'

import type {ScheduledPublishingMode} from '../../core/scheduledPublishing/contexts/types'

/**
 * The scheduled publishing mode as a promise for `use()`, provided by the scheduled publishing
 * plugin's studio provider. Settles once the feature check has answered: `'default'` when the plan
 * has the feature, `'upsell'` when it does not, `null` when the check failed. `null` where the
 * plugin is not loaded; read it as `promise ? use(promise) : null`.
 * @internal
 */
export const ScheduledPublishingModePromiseContext =
  createContext<Promise<ScheduledPublishingMode> | null>(
    'sanity/_singletons/context/scheduled-publishing-mode-promise',
    null,
  )
