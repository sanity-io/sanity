import {type SlugSourceContext} from '@sanity/types'
import {useMemo} from 'react'

import {useDataset} from '../../../../hooks/useDataset'
import {useProjectId} from '../../../../hooks/useProjectId'
import {useSchema} from '../../../../hooks/useSchema'
import {useCurrentUser} from '../../../../store/user'
import {useSource} from '../../../../studio/source'

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
