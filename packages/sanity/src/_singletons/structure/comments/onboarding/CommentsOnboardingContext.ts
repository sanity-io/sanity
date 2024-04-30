import {createContext} from 'react'

import type {CommentsOnboardingContextValue} from '../../../../core/comments/context/onboarding/types'

/**
 * @internal
 */
export const CommentsOnboardingContext = createContext<CommentsOnboardingContextValue | null>(null)
