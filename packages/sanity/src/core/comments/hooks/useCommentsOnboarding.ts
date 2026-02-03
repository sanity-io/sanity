import {type CommentsOnboardingContextValue} from '../context/onboarding/types'
import {useContext} from 'react'
import {CommentsOnboardingContext} from 'sanity/_singletons'

export function useCommentsOnboarding(): CommentsOnboardingContextValue {
  const ctx = useContext(CommentsOnboardingContext)

  if (!ctx) {
    throw new Error('useCommentsOnboarding: missing context value')
  }

  return ctx
}
