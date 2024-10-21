import {useEffect, useState} from 'react'
import {type SanityClient, useClient} from 'sanity'

import {useSanityCreateConfig} from '../context/useSanityCreateConfig'
import {type AppIdCache} from './appIdCache'
import {getStudioManifest} from './manifest'

// @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
const isStaging = typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true
const internalUrlSuffix = isStaging ? 'studio.sanity.work' : 'sanity.studio'

export interface ResolvedStudioAppId {
  loading: boolean
  appId?: string
}

interface StudioAppResponse {
  id: string
  title?: string
  type: 'studio' | string
  urlType: 'internal' | 'external' | string
  appHost: string
}

export function getStudioUrl(app: StudioAppResponse): string {
  return app.urlType === 'internal' ? `https://${app.appHost}.${internalUrlSuffix}` : app.appHost
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
          appIdFetcher: (id) => fetchCreateCompatibleAppId(id, client, config.fallbackStudioOrigin),
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

export async function fetchCreateCompatibleAppId(
  projectId: string,
  client: SanityClient,
  fallbackOrigin?: string,
): Promise<string | undefined> {
  const apps = (await client.request({
    method: 'GET',
    url: `/projects/${projectId}/user-applications`,
  })) as StudioAppResponse[]

  const origin = window.location?.origin

  const appsWithStudioUrl = apps.map((app) => ({...app, studioUrl: getStudioUrl(app)}))
  const appMatchingOrigin = appsWithStudioUrl.find((app) => {
    return app && origin && app.studioUrl?.startsWith(origin)
  })

  if (appMatchingOrigin?.appHost) {
    const manifest = await getStudioManifest(getStudioUrl(appMatchingOrigin))
    if (manifest) {
      return appMatchingOrigin.id
    }
  }

  const appMatchingFallback = appsWithStudioUrl.find((app) => {
    return app && fallbackOrigin && app.studioUrl?.startsWith(`https://${fallbackOrigin}`)
  })

  return appMatchingFallback?.id
}
