import {useEffect, useMemo, useState} from 'react'
import {useClient, useSource} from 'sanity'

import {useSanityCreateConfig} from '../context/useSanityCreateConfig'
import {type AppIdCache, type AppIdFetcher} from './appIdCache'
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
  const client = useClient({apiVersion: '2024-09-01'})
  const config = useSanityCreateConfig()
  const {projectId} = useSource()

  const appIdFetcher: AppIdFetcher = useMemo(() => {
    return (pId) =>
      fetchCreateCompatibleAppId({
        projectId: pId,
        client,
        fallbackOrigin: config.fallbackStudioOrigin,
      })
  }, [client, config.fallbackStudioOrigin])

  return useStudioAppIdStoreInner({
    projectId,
    cache,
    appIdFetcher,
    enabled: config.startInCreateEnabled,
  })
}

export function useStudioAppIdStoreInner(props: {
  cache: AppIdCache
  projectId: string
  enabled: boolean
  appIdFetcher: AppIdFetcher
}): ResolvedStudioAppId {
  const {cache, enabled, appIdFetcher, projectId} = props
  const [loading, setLoading] = useState(false)

  const [appId, setAppId] = useState<string | undefined>()

  useEffect(() => {
    let mounted = true
    async function getAppId() {
      if (!projectId) {
        return
      }
      setLoading(true)

      try {
        const entry = await cache.get({projectId, appIdFetcher})
        if (mounted) setAppId(entry?.appId)
      } catch (err) {
        if (mounted) setAppId(undefined)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (enabled) {
      getAppId().catch(console.error)
    }
    return () => {
      mounted = false
      setLoading(false)
    }
  }, [setLoading, appIdFetcher, cache, enabled, projectId])

  return {
    loading,
    appId,
  }
}
