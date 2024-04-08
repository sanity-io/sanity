import {createContext} from 'react'

import type {CommentsOnboardingContextValue} from '../../../../structure/comments/src/context/onboarding/types'

/**
 * @internal
 */
export const CommentsOnboardingContext = createContext<CommentsOnboardingContextValue | null>(null)
