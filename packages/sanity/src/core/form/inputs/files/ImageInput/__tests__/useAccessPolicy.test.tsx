import {type SanityClient} from '@sanity/client'
import {renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {enqueueAssetAccessPolicyFetch} from '../../../../../store/accessPolicy/fetch'
import {makeMediaLibraryRef} from '../../../../../store/accessPolicy/refs'
import {useProjectDatasets} from '../../../../../store/project/useProjectDatasets'
import {useAccessPolicy} from '../useAccessPolicy'

vi.mock('../../../../../store/project/useProjectDatasets')
vi.mock('../../../../../store/accessPolicy/fetch')

function makeClient(config: {dataset?: string; token?: string}): SanityClient {
  return {
    config: () => ({dataset: config.dataset, token: config.token}),
  } as unknown as SanityClient
}

const privateDatasetEntry = {
  name: 'production',
  aclMode: 'private' as const,
  createdAt: '2024-01-01',
  createdByUserId: 'user',
  tags: [],
}

const publicDatasetEntry = {
  name: 'production',
  aclMode: 'public' as const,
  createdAt: '2024-01-01',
  createdByUserId: 'user',
  tags: [],
}

describe('useAccessPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('plain (non-Media-Library) sources', () => {
    const plainImageSource = {
      _type: 'image',
      asset: {_ref: 'image-abc-100x100-jpg', _type: 'reference'},
    }

    it('returns "private" when the workspace dataset has aclMode: private', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [privateDatasetEntry]})

      const {result} = renderHook(() =>
        useAccessPolicy({
          client: makeClient({dataset: 'production'}),
          source: plainImageSource,
        }),
      )

      expect(result.current).toBe('private')
    })

    it('returns "public" when the workspace dataset has aclMode: public', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [publicDatasetEntry]})

      const {result} = renderHook(() =>
        useAccessPolicy({
          client: makeClient({dataset: 'production'}),
          source: plainImageSource,
        }),
      )

      expect(result.current).toBe('public')
    })

    it('returns "checking" while the dataset list is still loading', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: null})

      const {result} = renderHook(() =>
        useAccessPolicy({
          client: makeClient({dataset: 'production'}),
          source: plainImageSource,
        }),
      )

      expect(result.current).toBe('checking')
    })

    it('falls back to "public" when the dataset is not in the project list', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [privateDatasetEntry]})

      const {result} = renderHook(() =>
        useAccessPolicy({
          client: makeClient({dataset: 'staging'}),
          source: plainImageSource,
        }),
      )

      expect(result.current).toBe('public')
    })

    it('falls back to "public" when the client has no dataset configured', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [privateDatasetEntry]})

      const {result} = renderHook(() =>
        useAccessPolicy({
          client: makeClient({}),
          source: plainImageSource,
        }),
      )

      expect(result.current).toBe('public')
    })
  })

  describe('Media Library sources', () => {
    const libraryId = 'lib123'
    const assetId = 'image-xyz-200x200-png'
    const mediaLibrarySource = {
      media: {
        _ref: makeMediaLibraryRef(libraryId, assetId),
        _type: 'globalDocumentReference' as const,
      },
    }

    it('returns "unknown" for cookie-auth clients (no token)', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [privateDatasetEntry]})

      const {result} = renderHook(() =>
        useAccessPolicy({
          client: makeClient({dataset: 'production'}),
          source: mediaLibrarySource,
        }),
      )

      expect(result.current).toBe('unknown')
      expect(enqueueAssetAccessPolicyFetch).not.toHaveBeenCalled()
    })

    it('resolves the per-asset cdnAccessPolicy when the client has a token', async () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [privateDatasetEntry]})
      vi.mocked(enqueueAssetAccessPolicyFetch).mockResolvedValue('private')

      const {result} = renderHook(() =>
        useAccessPolicy({
          client: makeClient({dataset: 'production', token: 'tok'}),
          source: mediaLibrarySource,
        }),
      )

      await waitFor(() => expect(result.current).toBe('private'))
      expect(enqueueAssetAccessPolicyFetch).toHaveBeenCalledWith(
        makeMediaLibraryRef(libraryId, assetId),
        expect.anything(),
      )
    })
  })
})
