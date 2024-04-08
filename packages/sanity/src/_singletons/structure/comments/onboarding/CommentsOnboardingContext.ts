import {createContext} from 'react'
import {CommentsOnboardingContextValue} from '../../../../core/comments/context/onboarding/types'

/**
 * @internal
 */
export const CommentsOnboardingContext = createContext<CommentsOnboardingContextValue | null>(null)
