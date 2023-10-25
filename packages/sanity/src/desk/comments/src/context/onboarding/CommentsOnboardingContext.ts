import {createContext} from 'react'
import {CommentsOnboardingContextValue} from './types'

export const CommentsOnboardingContext = createContext<CommentsOnboardingContextValue | null>(null)
