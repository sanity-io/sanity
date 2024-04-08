import {createContext} from 'react'

import {MentionUserContextValue} from '../../../core/tasks/context/mentionUser/types'

/**
 * @internal
 */
export const MentionUserContext = createContext<MentionUserContextValue | null>(null)
