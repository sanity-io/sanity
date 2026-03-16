import {type SanityClient} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {
  type CompatibleStudioAppId,
  fetchCreateCompatibleAppId,
  type StudioAppResponse,
} from '../fetchCreateCompatibleAppId'

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

    const result = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      checkStudioManifest: async () => true,
      origin: 'https://my-studio.sanity.studio',
    })

    const expected: CompatibleStudioAppId = {
      appId: 'app1',
      studioApps: [
        {
          ...apps[0],
          studioUrl: 'https://my-studio.sanity.studio',
        },
      ],
    }
    expect(result).toEqual(expected)
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

    const result = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      checkStudioManifest: async () => true,
      origin: 'https://custom-deploy.com',
    })

    const expected: CompatibleStudioAppId = {
      appId: 'app1',
      studioApps: [
        {
          ...apps[0],
          studioUrl: 'https://custom-deploy.com',
        },
      ],
    }
    expect(result).toEqual(expected)
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

    const result = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      checkStudioManifest: async () => true,
      fallbackOrigin: 'my-studio.sanity.studio',
      origin: 'http://localhost:3333',
    })

    const expected: CompatibleStudioAppId = {
      appId: 'app1',
      studioApps: [
        {
          ...apps[0],
          studioUrl: 'https://my-studio.sanity.studio',
        },
      ],
    }

    expect(result).toEqual(expected)
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

    const result = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      checkStudioManifest: async () => false,
      fallbackOrigin: 'my-studio.sanity.studio',
      origin: 'http://localhost:3333',
    })

    const expected: CompatibleStudioAppId = {
      appId: 'app1',
      studioApps: [
        {
          ...apps[0],
          studioUrl: 'https://my-studio.sanity.studio',
        },
      ],
    }

    expect(result).toEqual(expected)
  })
})

function mockRequestClient(requestResponse: unknown): SanityClient {
  return {
    request: () => requestResponse,
  } as unknown as SanityClient
}
