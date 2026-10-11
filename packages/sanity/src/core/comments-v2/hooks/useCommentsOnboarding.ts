import {useContext} from 'react'
import {CommentsOnboardingContextV2} from 'sanity/_singletons'

import {type CommentsOnboardingContextValue} from '../context/onboarding/types'

export function useCommentsOnboarding(): CommentsOnboardingContextValue {
  const ctx = useContext(CommentsOnboardingContextV2)

  if (!ctx) {
    throw new Error('useCommentsOnboarding: missing context value')
  }

  return ctx
}
