import {createContext} from 'react'

import type {ScheduledPublishingEnabledContextValue} from '../../../../core/scheduledPublishing/tool/contexts/ScheduledPublishingEnabledProvider'

/**
 * @internal
 */
export const ScheduledPublishingEnabledContext =
  createContext<ScheduledPublishingEnabledContextValue | null>(null)
