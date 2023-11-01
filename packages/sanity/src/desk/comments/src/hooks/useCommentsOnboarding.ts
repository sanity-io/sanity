import {useContext} from 'react'
import {CommentsOnboardingContext} from '../context/onboarding'
import {CommentsOnboardingContextValue} from '../context/onboarding/types'

/**
 * @beta
 * @hidden
 */
export function useCommentsOnboarding(): CommentsOnboardingContextValue {
  const ctx = useContext(CommentsOnboardingContext)

  if (!ctx) {
    throw new Error('useCommentsOnboarding: missing context value')
  }

  return ctx
}
