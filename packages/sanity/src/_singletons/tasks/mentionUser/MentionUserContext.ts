import {createContext} from 'react'

import type {MentionUserContextValue} from '../../../tasks/src/tasks/context/mentionUser/types'

/**
 * @internal
 */
export const MentionUserContext = createContext<MentionUserContextValue | null>(null)
