/* eslint-disable max-nested-callbacks */
import {renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createAppIdCache} from '../appIdCache'
import {useStudioAppIdStoreInner} from '../useStudioAppIdStore'

describe('useStudioAppIdStore', () => {
  it('should return appId when promise resolves', async () => {
    const {result} = renderHook((args) => useStudioAppIdStoreInner(args), {
      initialProps: {
        cache: createAppIdCache(),
        enabled: true,
        projectId: 'projectId',
        appIdFetcher: async (projectId) => `${projectId}-appId`,
      } satisfies Parameters<typeof useStudioAppIdStoreInner>[0],
    })

    expect(result.current).toEqual({
      loading: true,
      appId: undefined,
    })
    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        appId: 'projectId-appId',
      }),
    )
  })

  it('should not load anything when feature is disabled', async () => {
    const {result} = renderHook((args) => useStudioAppIdStoreInner(args), {
      initialProps: {
        cache: createAppIdCache(),
        enabled: false,
        projectId: 'projectId',
        appIdFetcher: async (projectId) => `${projectId}-appId`,
      } satisfies Parameters<typeof useStudioAppIdStoreInner>[0],
    })

    expect(result.current).toEqual({
      loading: false,
      appId: undefined,
    })
    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        appId: undefined,
      }),
    )
  })
})
