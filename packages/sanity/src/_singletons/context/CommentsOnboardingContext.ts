import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {CommentsOnboardingContextValue} from '../../core/comments/context/onboarding/types'

/**
 * @internal
 */
export const CommentsOnboardingContext: Context<CommentsOnboardingContextValue | null> =
  createContext<CommentsOnboardingContextValue | null>(
    'sanity/_singletons/context/comments-onboarding',
    null,
  )
