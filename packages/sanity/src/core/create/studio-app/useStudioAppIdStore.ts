import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {useSanityCreateConfig} from '../context/useSanityCreateConfig'
import {type AppIdCache} from './appIdCache'
import {fetchCreateCompatibleAppId} from './fetchCreateCompatibleAppId'

export interface ResolvedStudioAppId {
  loading: boolean
  appId?: string
}

/**
 * Fetches & caches the Studio appId for the current origin.
 *
 * @internal
 */
export function useStudioAppIdStore(cache: AppIdCache): ResolvedStudioAppId {
  const [loading, setLoading] = useState(false)
  const client = useClient({apiVersion: '2024-09-01'})
  const config = useSanityCreateConfig()

  const [appId, setAppId] = useState<string | undefined>()

  useEffect(() => {
    let mounted = true
    async function getAppId() {
      const projectId = client.config().projectId
      if (!projectId) {
        return
      }
      setLoading(true)

      try {
        const entry = await cache.get({
          projectId,
          appIdFetcher: (id) =>
            fetchCreateCompatibleAppId({
              projectId: id,
              client,
              fallbackOrigin: config.fallbackStudioOrigin,
            }),
        })
        if (mounted) setAppId(entry?.appId)
      } catch (err) {
        if (mounted) setAppId(undefined)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (config.startInCreateEnabled) {
      getAppId().catch(console.error)
    }
    return () => {
      mounted = false
      setLoading(false)
    }
  }, [setLoading, client, cache, config])

  return {
    loading,
    appId,
  }
}
