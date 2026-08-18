import {createContext} from 'sanity/_createContext'

import type {FeedbackContextValue} from '../../core/feedback/types'

export type {FeedbackContextValue} from '../../core/feedback/types'

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
