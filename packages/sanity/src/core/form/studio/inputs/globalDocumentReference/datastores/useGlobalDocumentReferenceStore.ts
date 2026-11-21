import {useMemo} from 'react'

import {useClient} from '../../../../../hooks/useClient'
import {useResourceCache} from '../../../../../store/ResourceCacheProvider'
import {
  createGlobalDocumentReferenceStore,
  type GlobalDocumentReferenceStore,
} from './createGlobalDocumentReferenceStore'

const GLOBAL_DOCUMENT_REFERENCE_CLIENT_OPTIONS = {apiVersion: '2025-02-19'}

/**
 * Returns the store shared by every global document reference input in the workspace
 *
 * @internal
 */
export function useGlobalDocumentReferenceStore(): GlobalDocumentReferenceStore {
  const client = useClient(GLOBAL_DOCUMENT_REFERENCE_CLIENT_OPTIONS)
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const store =
      resourceCache.get<GlobalDocumentReferenceStore>({
        namespace: 'globalDocumentReferenceStore',
        dependencies: [client],
      }) || createGlobalDocumentReferenceStore({client})

    resourceCache.set({
      namespace: 'globalDocumentReferenceStore',
      dependencies: [client],
      value: store,
    })

    return store
  }, [client, resourceCache])
}
