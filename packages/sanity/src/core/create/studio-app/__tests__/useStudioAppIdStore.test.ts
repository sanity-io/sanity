/* eslint-disable max-nested-callbacks */
import {renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createAppIdCache} from '../appIdCache'
import {type ResolvedStudioApp, useStudioAppIdStoreInner} from '../useStudioAppIdStore'

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
})
