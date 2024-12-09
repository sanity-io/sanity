import {type SanityClient} from 'sanity'

import {getStudioManifest} from './manifest'
import {type StudioManifest} from './manifestTypes'

export interface StudioAppResponse {
  id: string
  title?: string
  type: 'studio' | string
  urlType: 'internal' | 'external' | string
  appHost: string
}

// @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
const isStaging = typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true
const internalUrlSuffix = isStaging ? 'studio.sanity.work' : 'sanity.studio'

export async function fetchCreateCompatibleAppId(args: {
  projectId: string
  client: SanityClient
  fallbackOrigin?: string
  internalSuffix?: string
  fetchStudioManifest?: (studioHost: string) => Promise<StudioManifest | undefined>
  origin?: string
}): Promise<string | undefined> {
  const {
    projectId,
    client,
    fallbackOrigin,
    internalSuffix = internalUrlSuffix,
    fetchStudioManifest = getStudioManifest,
    origin = window.location?.origin,
  } = args
  const apps = (await client.request({
    method: 'GET',
    url: `/projects/${projectId}/user-applications`,
  })) as StudioAppResponse[]

  const appsWithStudioUrl = apps.map((app) => ({
    ...app,
    studioUrl: getStudioUrl(app, internalSuffix),
  }))
  const appMatchingOrigin = appsWithStudioUrl.find((app) => {
    return app && origin && app.studioUrl?.startsWith(origin)
  })

  if (appMatchingOrigin?.appHost) {
    const manifest = await fetchStudioManifest(getStudioUrl(appMatchingOrigin, internalSuffix))
    if (manifest) {
      return appMatchingOrigin.id
    }
  }

  const appMatchingFallback = appsWithStudioUrl.find((app) => {
    return app && fallbackOrigin && app.studioUrl?.startsWith(`https://${fallbackOrigin}`)
  })

  return appMatchingFallback?.id
}

function getStudioUrl(app: StudioAppResponse, internalSuffix: string): string {
  return app.urlType === 'internal' ? `https://${app.appHost}.${internalSuffix}` : app.appHost
}
