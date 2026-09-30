import {createRemoteInstance} from '@sanity/sdk-react/dashboard'

import {
  type FederatedAssetSourceModule,
  type FederatedAssetSourceRef,
  SUPPORTED_VIEW_CONTRACT_VERSION,
} from './types'

/**
 * The Studio's federation client for asset-source views. The view artifact
 * bundles all of its dependencies (its build sets an empty share map), so no
 * `shared` scope is seeded.
 */
const host = createRemoteInstance({name: 'sanity-studio-asset-source-host'})

const modulePromises = new Map<string, Promise<FederatedAssetSourceModule>>()

/**
 * Loads (and caches) a federated asset-source view module. A failed load is
 * evicted from the cache so the next dialog open retries instead of replaying
 * the failure.
 *
 * @internal
 */
export function loadFederatedAssetSourceModule(
  ref: FederatedAssetSourceRef,
): Promise<FederatedAssetSourceModule> {
  const {remote, moduleId} = ref
  const cacheKey = `${remote.entry}#${moduleId}`
  const cached = modulePromises.get(cacheKey)
  if (cached) return cached

  const attempt = (async () => {
    host.registerRemotes([remote])
    const module = await host.loadRemote<FederatedAssetSourceModule>(moduleId)
    if (typeof module?.render !== 'function') {
      throw new Error(`Loaded ${moduleId} but it does not export a render() function`)
    }
    if (module.version !== SUPPORTED_VIEW_CONTRACT_VERSION) {
      throw new Error(
        `${moduleId} implements view contract version ${module.version}, ` +
          `but this Studio supports version ${SUPPORTED_VIEW_CONTRACT_VERSION}`,
      )
    }
    return module
  })()

  modulePromises.set(cacheKey, attempt)
  attempt.catch(() => {
    if (modulePromises.get(cacheKey) === attempt) {
      modulePromises.delete(cacheKey)
    }
  })
  return attempt
}
