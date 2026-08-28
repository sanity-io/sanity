import {useContext} from 'react'
import {CommentsEnabledContext} from 'sanity/_singletons'

import {type CommentsEnabledContextValue} from '../context/enabled/types'

/**
 * @beta
 * @hidden
 */
export function useCommentsEnabled(): CommentsEnabledContextValue {
  return useContext(CommentsEnabledContext)
}
