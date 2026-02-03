import {type CommentsEnabledContextValue} from '../context/enabled/types'
import {useContext} from 'react'
import {CommentsEnabledContext} from 'sanity/_singletons'

/**
 * @beta
 * @hidden
 */
export function useCommentsEnabled(): CommentsEnabledContextValue {
  return useContext(CommentsEnabledContext)
}
