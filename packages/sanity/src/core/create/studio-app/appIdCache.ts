import {type CompatibleStudioAppId} from './fetchCreateCompatibleAppId'

export interface AppIdCache {
  get: (args: {
    projectId: string
    appIdFetcher: AppIdFetcher
  }) => Promise<CompatibleStudioAppId | undefined>
}
export type AppIdFetcher = (projectId: string) => Promise<CompatibleStudioAppId>

export function createAppIdCache(): AppIdCache {
  const appIdCache: {
    [key: string]: CompatibleStudioAppId | Promise<CompatibleStudioAppId | undefined> | undefined
  } = {}

  return {
    get: async (args) => {
      const {projectId, appIdFetcher} = args
      let cacheElement = appIdCache[projectId]
      if (!cacheElement) {
        cacheElement = (async () => {
          try {
            return await appIdFetcher(projectId)
          } catch (error) {
            console.error(error)
            appIdCache[projectId] = undefined
            return undefined
          }
        })()
        appIdCache[projectId] = cacheElement
        return cacheElement
      }

      return cacheElement
    },
  }
}
