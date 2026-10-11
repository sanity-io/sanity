import {renderHook, waitFor} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {AppIdCacheContext} from 'sanity/_singletons'
import {beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type AppIdCache, createAppIdCache} from '../appIdCache'
import {
  type ResolvedStudioApp,
  useStudioAppIdStore,
  useStudioAppIdStoreInner,
} from '../useStudioAppIdStore'

let TestProvider: ComponentType<{children?: ReactNode}>
// The projects the origin lookup ran for.
let lookups: string[] = []

const recordingCache: AppIdCache = {
  get: async ({projectId}) => {
    lookups.push(projectId)
    return undefined
  },
}

beforeAll(async () => {
  TestProvider = await createTestProvider()
})

beforeEach(() => {
  lookups = []
})

function Wrapper({children}: {children: ReactNode}) {
  return (
    <TestProvider>
      <AppIdCacheContext.Provider value={recordingCache}>{children}</AppIdCacheContext.Provider>
    </TestProvider>
  )
}

describe('useStudioAppIdStore', () => {
  it('should return appId when promise resolves', async () => {
    const {result} = renderHook((args) => useStudioAppIdStoreInner(args), {
      initialProps: {
        cache: createAppIdCache(),
        enabled: true,
        projectId: 'projectId',
        appIdFetcher: async (projectId) => ({
          appId: `${projectId}-appId`,
          studioApps: [],
        }),
      } satisfies Parameters<typeof useStudioAppIdStoreInner>[0],
    })

    expect(result.current).toEqual({
      loading: true,
      studioApp: undefined,
    } satisfies ResolvedStudioApp)
    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        studioApp: {
          appId: 'projectId-appId',
          studioApps: [],
        },
      } satisfies ResolvedStudioApp),
    )
  })

  it('should not load anything when feature is disabled', async () => {
    const {result} = renderHook((args) => useStudioAppIdStoreInner(args), {
      initialProps: {
        cache: createAppIdCache(),
        enabled: false,
        projectId: 'projectId',
        appIdFetcher: async (projectId) => ({
          appId: `${projectId}-appId`,
          studioApps: [],
        }),
      } satisfies Parameters<typeof useStudioAppIdStoreInner>[0],
    })

    expect(result.current).toEqual({
      loading: false,
      studioApp: undefined,
    } satisfies ResolvedStudioApp)
    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        studioApp: undefined,
      } satisfies ResolvedStudioApp),
    )
  })

  it('uses the app id of the message bus connection instead of looking Studio up', () => {
    stubMessageBusHost()

    const {result} = renderHook(() => useStudioAppIdStore({enabled: true}), {wrapper: Wrapper})

    expect(result.current).toEqual({
      loading: false,
      studioApp: {appId: 'studio', studioApps: []},
    } satisfies ResolvedStudioApp)
    expect(lookups).toEqual([])
  })

  it('looks Studio up by origin without a message bus host', async () => {
    renderHook(() => useStudioAppIdStore({enabled: true}), {wrapper: Wrapper})

    await waitFor(() => expect(lookups).toEqual(['mock-project-id']))
  })
})
