import {type Schema} from '@sanity/types'
import {useMemo} from 'react'

import {useClient} from '../../../../../hooks/useClient'
import {createSearch} from '../../../../../search/search'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {useWorkspace} from '../../../../workspace'
import {getSearchableOmnisearchTypes} from '../utils/selectors'
import {useSearchMaxFieldDepth} from './useSearchMaxFieldDepth'

/**
 * Searches every document type visible to omnisearch with the workspace's search strategy.
 */
export function useGlobalSearchFunction(schema: Schema): ReturnType<typeof createSearch> {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const maxFieldDepth = useSearchMaxFieldDepth()
  const {strategy} = useWorkspace().search

  return useMemo(
    () =>
      createSearch(getSearchableOmnisearchTypes(schema), client, {
        tag: 'search.global',
        unique: true,
        strategy,
        maxDepth: maxFieldDepth,
      }),
    [schema, client, strategy, maxFieldDepth],
  )
}
