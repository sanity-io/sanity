import {useContext} from 'react'

import {CommentsOnboardingContext} from '../context/onboarding'
import {type CommentsOnboardingContextValue} from '../context/onboarding/types'

export function useCommentsOnboarding(): CommentsOnboardingContextValue {
  const ctx = useContext(CommentsOnboardingContext)

  if (!ctx) {
    throw new Error('useCommentsOnboarding: missing context value')
  }

  return ctx
}
