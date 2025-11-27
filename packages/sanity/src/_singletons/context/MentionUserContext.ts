import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {MentionUserContextValue} from '../../core/tasks/context/mentionUser/types'

/**
 * @internal
 */
export const MentionUserContext: Context<MentionUserContextValue | null> =
  createContext<MentionUserContextValue | null>('sanity/_singletons/context/mention-user', null)
