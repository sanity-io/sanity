import {createContext} from 'sanity/_createContext'

import type {ScheduledPublishingEnabledContextValue} from '../../core/scheduledPublishing/tool/contexts/ScheduledPublishingEnabledProvider'

/**
 * @internal
 */
export const ScheduledPublishingEnabledContext =
  createContext<ScheduledPublishingEnabledContextValue | null>(
    'sanity/_singletons/context/scheduled-publishing-enabled',
    null,
  )
