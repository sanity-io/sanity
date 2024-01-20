import {createContext} from 'react'

import {type CommentsOnboardingContextValue} from './types'

export const CommentsOnboardingContext = createContext<CommentsOnboardingContextValue | null>(null)
