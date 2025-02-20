import {createContext} from 'sanity/_createContext'

import type {ScheduledPublishingEnabledContextValue} from '../../core/scheduledPublishing/tool/contexts/ScheduledPublishingEnabledProvider'

const DEFAULT: ScheduledPublishingEnabledContextValue = {
  enabled: false,
  mode: null,
  hasUsedScheduledPublishing: {
    used: false,
    loading: false,
  },
}

/**
 * @internal
 */
export const ScheduledPublishingEnabledContext =
  createContext<ScheduledPublishingEnabledContextValue>(
    'sanity/_singletons/context/scheduled-publishing-enabled',
    DEFAULT,
  )
