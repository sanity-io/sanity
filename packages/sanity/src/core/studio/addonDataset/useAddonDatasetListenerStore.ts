import {useMemo} from 'react'

import {
  type AddonDatasetListenerStore,
  createAddonDatasetListenerStore,
} from '../../store/addonDatasetListener/createAddonDatasetListenerStore'
import {useResourceCache} from '../../store/ResourceCacheProvider'
import {useAddonDataset} from './useAddonDataset'

/**
 * The shared listener on the comments and tasks in the addon dataset, or `null` while the
 * workspace has no addon dataset.
 *
 * @internal
 */
export function useAddonDatasetListenerStore(): AddonDatasetListenerStore | null {
  const {client} = useAddonDataset()
  const resourceCache = useResourceCache()

  return useMemo(() => {
    if (!client) return null

    const addonDatasetListenerStore =
      resourceCache.get<AddonDatasetListenerStore>({
        namespace: 'addonDatasetListenerStore',
        dependencies: [client],
      }) || createAddonDatasetListenerStore({client})

    resourceCache.set({
      namespace: 'addonDatasetListenerStore',
      dependencies: [client],
      value: addonDatasetListenerStore,
    })

    return addonDatasetListenerStore
  }, [client, resourceCache])
}
