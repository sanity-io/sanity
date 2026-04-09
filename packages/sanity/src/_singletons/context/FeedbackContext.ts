import {createContext} from 'sanity/_createContext'

import {type TagValue} from '../../core/feedback/types'
import {type ConsentStatus} from '../../core/studio/telemetry/telemetryConsent'

/** @internal */
export interface FeedbackContextValue {
  telemetryConsent: ConsentStatus
  userName: string | undefined
  userEmail: string | undefined
  tags: Record<string, TagValue>
}

/** @internal */
export const FeedbackContext = createContext<FeedbackContextValue>(
  'sanity/_singletons/context/feedback',
  {
    telemetryConsent: 'denied',
    userName: undefined,
    userEmail: undefined,
    tags: {},
  },
)
