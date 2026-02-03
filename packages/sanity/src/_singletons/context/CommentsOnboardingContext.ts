import type {CommentsOnboardingContextValue} from '../../core/comments/context/onboarding/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const CommentsOnboardingContext = createContext<CommentsOnboardingContextValue | null>(
  'sanity/_singletons/context/comments-onboarding',
  null,
)
