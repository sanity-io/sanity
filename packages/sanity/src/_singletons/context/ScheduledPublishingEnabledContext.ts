import {createContext} from 'sanity/_createContext'

import type {HasUsedScheduledPublishing} from '../../core/scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'

/**
 * @internal
 */
export type ScheduledPublishingEnabledContextValue =
  | {
      enabled: false
      mode: null
      hasUsedScheduledPublishing: HasUsedScheduledPublishing
    }
  | {
      enabled: true
      mode: 'default' | 'upsell'
      hasUsedScheduledPublishing: HasUsedScheduledPublishing
    }

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
