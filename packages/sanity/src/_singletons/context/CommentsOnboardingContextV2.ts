import {createContext} from 'sanity/_createContext'

import type {CommentsOnboardingContextValue} from '../../core/comments-v2/context/onboarding/types'

/**
 * @internal
 */
export const CommentsOnboardingContextV2 = createContext<CommentsOnboardingContextValue | null>(
  'sanity/_singletons/context/comments-v2-onboarding',
  null,
)
