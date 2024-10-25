import {type SanityClient} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {fetchCreateCompatibleAppId, type StudioAppResponse} from '../fetchCreateCompatibleAppId'
import {type StudioManifest} from '../manifestTypes'

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
    const fetchStudioManifest = async (): Promise<StudioManifest | undefined> => ({
      version: 1,
      createdAt: new Date().toISOString(),
      workspaces: [], // doesnt matter for this test
    })

    const appId = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      fetchStudioManifest,
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
    const fetchStudioManifest = async (): Promise<StudioManifest | undefined> => ({
      version: 1,
      createdAt: new Date().toISOString(),
      workspaces: [], // doesnt matter for this test
    })

    const appId = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      fetchStudioManifest,
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
    const fetchStudioManifest = async (): Promise<StudioManifest | undefined> => ({
      version: 1,
      createdAt: new Date().toISOString(),
      workspaces: [], // doesnt matter for this test
    })

    const appId = await fetchCreateCompatibleAppId({
      projectId: 'projectId',
      internalSuffix: 'sanity.studio',
      client,
      fetchStudioManifest,
      fallbackOrigin: 'my-studio.sanity.studio',
      origin: 'http://localhost:3333',
    })

    expect(appId).toEqual('app1')
  })
})

function mockRequestClient(requestResponse: unknown): SanityClient {
  return {
    request: () => requestResponse,
  } as unknown as SanityClient
}
