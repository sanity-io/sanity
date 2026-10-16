import {createContext} from 'react'

import type {CommentsOnboardingContextValue} from '../../core/comments-v2/context/onboarding/types'

/**
 * @internal
 */
export const CommentsOnboardingContextV2 = createContext<CommentsOnboardingContextValue | null>(
  null,
)
