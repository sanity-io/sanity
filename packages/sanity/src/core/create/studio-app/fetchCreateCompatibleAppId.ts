import {type SanityClient} from '@sanity/client'

import {checkStudioManifestExists} from './checkStudioManifestExists'

export interface StudioAppResponse {
  id: string
  title?: string
  type: 'studio' | string
  urlType: 'internal' | 'external' | string
  appHost: string
}

export interface StudioApp extends StudioAppResponse {
  studioUrl: string
}

export interface CompatibleStudioAppId {
  /**
   * AppId to use for the current origin
   */
  appId: string | undefined

  /**
   * All available studio apps
   */
  studioApps: StudioApp[]
}

// @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
const isStaging = typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true
const internalUrlSuffix = isStaging ? 'studio.sanity.work' : 'sanity.studio'

async function fetchStudiosWithUrl(
  client: SanityClient,
  projectId: string,
  internalSuffix: string,
) {
  const apps = (await client.request({
    method: 'GET',
    url: `/projects/${projectId}/user-applications`,
  })) as StudioAppResponse[]

  return apps.map((app) => ({
    ...app,
    studioUrl: getStudioUrl(app, internalSuffix),
  }))
}

export async function fetchCreateCompatibleAppId(args: {
  projectId: string
  client: SanityClient
  fallbackOrigin?: string
  internalSuffix?: string
  checkStudioManifest?: (studioHost: string) => Promise<boolean>
  origin?: string
}): Promise<CompatibleStudioAppId> {
  const {
    projectId,
    client,
    fallbackOrigin,
    internalSuffix = internalUrlSuffix,
    checkStudioManifest = checkStudioManifestExists,
    origin = window.location?.origin,
  } = args
  const appsWithStudioUrl = await fetchStudiosWithUrl(client, projectId, internalSuffix)

  const appMatchingOrigin = appsWithStudioUrl.find((app) => {
    return app && origin && app.studioUrl?.startsWith(origin)
  })

  if (appMatchingOrigin?.appHost) {
    const manifest = await checkStudioManifest(getStudioUrl(appMatchingOrigin, internalSuffix))
    if (manifest) {
      return {
        appId: appMatchingOrigin.id,
        studioApps: appsWithStudioUrl,
      }
    }
  }

  const appMatchingFallback = appsWithStudioUrl.find((app) => {
    return app && fallbackOrigin && app.studioUrl?.startsWith(`https://${fallbackOrigin}`)
  })

  return {
    appId: appMatchingFallback?.id,
    studioApps: appsWithStudioUrl,
  }
}

function getStudioUrl(app: StudioAppResponse, internalSuffix: string): string {
  return app.urlType === 'internal' ? `https://${app.appHost}.${internalSuffix}` : app.appHost
}
