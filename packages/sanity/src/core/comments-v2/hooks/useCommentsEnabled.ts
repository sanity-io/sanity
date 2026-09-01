import {useContext} from 'react'
import {CommentsEnabledContextV2} from 'sanity/_singletons'

import {type CommentsEnabledContextValue} from '../context/enabled/types'

/**
 * @beta
 * @hidden
 */
export function useCommentsEnabled(): CommentsEnabledContextValue {
  return useContext(CommentsEnabledContextV2)
}
