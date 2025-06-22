import {type SlugSourceContext} from '@sanity/types'
import {useMemo} from 'react'

import {useCurrentUser} from '../../../../../core/store/user/hooks'
import {useDataset} from '../../../../../core/hooks/useDataset'
import {useProjectId} from '../../../../../core/hooks/useProjectId'
import {useSchema} from '../../../../../core/hooks/useSchema'
import {useSource} from '../../../../../core/studio/source'

/**
 * @internal
 */
export type SlugContext = Omit<SlugSourceContext, 'parent' | 'parentPath'>

/**
 * @internal
 */
export function useSlugContext(): SlugContext {
  const {getClient} = useSource()
  const schema = useSchema()
  const currentUser = useCurrentUser()
  const projectId = useProjectId()
  const dataset = useDataset()

  return useMemo(() => {
    return {
      projectId,
      dataset,
      getClient,
      schema,
      currentUser,
    }
  }, [getClient, schema, currentUser, projectId, dataset])
}
