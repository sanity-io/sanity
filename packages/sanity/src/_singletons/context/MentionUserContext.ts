import type {MentionUserContextValue} from '../../core/tasks/context/mentionUser/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const MentionUserContext = createContext<MentionUserContextValue | null>(
  'sanity/_singletons/context/mention-user',
  null,
)
