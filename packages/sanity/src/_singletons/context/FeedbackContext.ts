import {createContext} from 'react'

import type {FeedbackContextValue} from '../../core/feedback/types'

export type {FeedbackContextValue} from '../../core/feedback/types'

/** @internal */
export const FeedbackContext = createContext<FeedbackContextValue>({
  telemetryConsent: 'denied',
  userName: undefined,
  userEmail: undefined,
  tags: {},
})
