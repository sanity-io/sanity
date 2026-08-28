import {createContext} from 'sanity/_createContext'

import type {CommentsOnboardingContextValue} from '../../core/comments-legacy/context/onboarding/types'

/**
 * @internal
 */
export const CommentsOnboardingLegacyContext = createContext<CommentsOnboardingContextValue | null>(
  'sanity/_singletons/context/comments-legacy-onboarding',
  null,
)
