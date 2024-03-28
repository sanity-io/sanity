import {createContext} from 'react'

import {type MentionUserContextValue} from './types'

/**
 * @internal
 */
export const MentionUserContext = createContext<MentionUserContextValue | null>(null)
