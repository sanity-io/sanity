import {use} from 'react'
import {CommentsOnboardingContext} from 'sanity/_singletons'

import {type CommentsOnboardingContextValue} from '../context/onboarding/types'

export function useCommentsOnboarding(): CommentsOnboardingContextValue {
  const ctx = use(CommentsOnboardingContext)

  if (!ctx) {
    throw new Error('useCommentsOnboarding: missing context value')
  }

  return ctx
}
