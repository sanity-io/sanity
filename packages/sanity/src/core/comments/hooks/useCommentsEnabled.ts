import {useContext} from 'react'
import {CommentsEnabledContext} from 'sanity/_singletons'

import {type CommentsEnabledContextValue} from '../context/enabled/types'

/**
 * @internal
 */
export function useCommentsEnabled(): CommentsEnabledContextValue {
  return useContext(CommentsEnabledContext)
}
