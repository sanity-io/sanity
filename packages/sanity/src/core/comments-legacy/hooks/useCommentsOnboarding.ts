import {useContext} from 'react'
import {CommentsOnboardingLegacyContext} from 'sanity/_singletons'

import {type CommentsOnboardingContextValue} from '../context/onboarding/types'

export function useCommentsOnboarding(): CommentsOnboardingContextValue {
  const ctx = useContext(CommentsOnboardingLegacyContext)

  if (!ctx) {
    throw new Error('useCommentsOnboarding: missing context value')
  }

  return ctx
}
