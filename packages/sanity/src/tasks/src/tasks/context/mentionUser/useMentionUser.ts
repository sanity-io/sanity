import {useContext} from 'react'

import {MentionUserContext} from './MentionUserContext'
import {type MentionUserContextValue} from './types'

/**
 * @internal
 */
export function useMentionUser(): MentionUserContextValue {
  const context = useContext(MentionUserContext)
  if (!context) {
    throw new Error('useMentionUser must be used within a MentionUserProvider')
  }
  return context
}
