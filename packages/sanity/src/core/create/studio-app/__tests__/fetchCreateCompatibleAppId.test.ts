import {type SanityClient} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {fetchCreateCompatibleAppId, type StudioAppResponse} from '../fetchCreateCompatibleAppId'

describe('fetchCreateCompatibleAppId', () => {
  it(`should return internal app matching origin`, async () => {
    const apps: StudioAppResponse[] = [
      {
        id: 'app1',
        appHost: 'my-studio',
        type: 'studio',
        title: 'My studio',
        urlType: 'internal',
      },
    ]
    const client = mockRequestClient(apps)

    const appId = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      checkStudioManifest: async () => true,
      origin: 'https://my-studio.sanity.studio',
    })

    expect(appId).toEqual('app1')
  })

  it(`should return external app matching origin`, async () => {
    const apps: StudioAppResponse[] = [
      {
        id: 'app1',
        appHost: 'https://custom-deploy.com',
        type: 'studio',
        title: 'Custom studio',
        urlType: 'external',
      },
    ]
    const client = mockRequestClient(apps)

    const appId = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      checkStudioManifest: async () => true,
      origin: 'https://custom-deploy.com',
    })

    expect(appId).toEqual('app1')
  })

  it(`should return internal app matching fallback origin`, async () => {
    const apps: StudioAppResponse[] = [
      {
        id: 'app1',
        appHost: 'my-studio',
        type: 'studio',
        title: 'My studio',
        urlType: 'internal',
      },
    ]
    const client = mockRequestClient(apps)

    const appId = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      checkStudioManifest: async () => true,
      fallbackOrigin: 'my-studio.sanity.studio',
      origin: 'http://localhost:3333',
    })

    expect(appId).toEqual('app1')
  })

  it(`should return undefined appId when app does not have manifest`, async () => {
    const apps: StudioAppResponse[] = [
      {
        id: 'app1',
        appHost: 'my-studio',
        type: 'studio',
        title: 'My studio',
        urlType: 'internal',
      },
    ]
    const client = mockRequestClient(apps)

    const appId = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      checkStudioManifest: async () => false,
      fallbackOrigin: 'my-studio.sanity.studio',
      origin: 'http://localhost:3333',
    })

    expect(appId).toBeUndefined()
  })
})

function mockRequestClient(requestResponse: unknown): SanityClient {
  return {
    request: () => requestResponse,
  } as unknown as SanityClient
}
