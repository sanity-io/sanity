import {createContext} from 'react'
import {CommentsOnboardingContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const CommentsOnboardingContext = createContext<CommentsOnboardingContextValue | null>(null)
