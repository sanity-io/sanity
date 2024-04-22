import {useContext} from 'react'

import {CommentsEnabledContext} from '../context/enabled'
import {type CommentsEnabledContextValue} from '../context/enabled/types'

/**
 * @beta
 * @hidden
 */
export function useCommentsEnabled(): CommentsEnabledContextValue {
  return useContext(CommentsEnabledContext)
}
