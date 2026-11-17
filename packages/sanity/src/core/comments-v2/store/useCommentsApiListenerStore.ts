import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'

import {useResourceCache} from '../../store/ResourceCacheProvider'
import {
  type CommentsApiListenerStore,
  createCommentsApiListenerStore,
} from './createCommentsApiListenerStore'

/**
 * The shared Comments API listener on the resource of `client`, or `null` without a client.
 *
 * @internal
 */
export function useCommentsApiListenerStore(
  client: SanityClient | null,
): CommentsApiListenerStore | null {
  const resourceCache = useResourceCache()

  return useMemo(() => {
    if (!client) return null

    const commentsApiListenerStore =
      resourceCache.get<CommentsApiListenerStore>({
        namespace: 'commentsApiListenerStore',
        dependencies: [client],
      }) || createCommentsApiListenerStore({client})

    resourceCache.set({
      namespace: 'commentsApiListenerStore',
      dependencies: [client],
      value: commentsApiListenerStore,
    })

    return commentsApiListenerStore
  }, [client, resourceCache])
}
