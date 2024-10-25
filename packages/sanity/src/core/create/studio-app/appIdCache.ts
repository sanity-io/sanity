export interface CachedAppId {
  appId: string | undefined
}

export interface AppIdCache {
  get: (args: {projectId: string; appIdFetcher: AppIdFetcher}) => Promise<CachedAppId | undefined>
}
export type AppIdFetcher = (projectId: string) => Promise<string | undefined>

export function createAppIdCache(): AppIdCache {
  const cache: {[key: string]: CachedAppId | Promise<CachedAppId | undefined> | undefined} = {}

  return {
    get: async (args) => {
      const {projectId, appIdFetcher} = args
      let cacheElement = cache[projectId]
      if (!cacheElement) {
        cacheElement = (async () => {
          try {
            const appId = await appIdFetcher(projectId)
            const entry = {
              appId,
            }
            cache[projectId] = entry
            return entry
          } catch (error) {
            console.error(error)
            cache[projectId] = undefined
            return undefined
          }
        })()
        cache[projectId] = cacheElement
        return cacheElement
      }

      return cacheElement
    },
  }
}
