import {use} from 'react'
import {MentionUserContext} from 'sanity/_singletons'

import {type MentionUserContextValue} from './types'

/**
 * @internal
 */
export function useMentionUser(): MentionUserContextValue {
  const context = use(MentionUserContext)
  if (!context) {
    throw new Error('useMentionUser must be used within a MentionUserProvider')
  }
  return context
}
