import {type SanityClient} from '@sanity/client'
import {renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {enqueueAssetAccessPolicyFetch} from '../../../../../store/accessPolicy/fetch'
import {makeMediaLibraryRef} from '../../../../../store/accessPolicy/refs'
import {type ProjectDatasetData} from '../../../../../store/project/types'
import {useProjectDatasets} from '../../../../../store/project/useProjectDatasets'
import {useAccessPolicy} from '../useAccessPolicy'

vi.mock('../../../../../store/project/useProjectDatasets')
vi.mock('../../../../../store/accessPolicy/fetch')

const PLAIN_SOURCE = {_type: 'image', asset: {_ref: 'image-abc-100x100-jpg', _type: 'reference'}}
const LIB_ID = 'lib123'
const ASSET_ID = 'image-xyz-200x200-png'
const ML_SOURCE = {
  media: {_ref: makeMediaLibraryRef(LIB_ID, ASSET_ID), _type: 'globalDocumentReference'},
}

function makeClient(datasetName?: string, token?: string): SanityClient {
  return {config: () => ({dataset: datasetName, token})} as unknown as SanityClient
}

function makeDataset(name: string, aclMode: 'public' | 'private'): ProjectDatasetData {
  return {name, aclMode, createdAt: '', createdByUserId: '', tags: []}
}

function renderPolicy(client: SanityClient, source: unknown) {
  return renderHook(() => useAccessPolicy({client, source: source as never})).result
}

describe('useAccessPolicy', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('plain (non-Media-Library) sources', () => {
    it('returns "private" when the workspace dataset has aclMode: private', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [makeDataset('production', 'private')]})
      expect(renderPolicy(makeClient('production'), PLAIN_SOURCE).current).toBe('private')
    })

    it('returns "public" when the workspace dataset has aclMode: public', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [makeDataset('production', 'public')]})
      expect(renderPolicy(makeClient('production'), PLAIN_SOURCE).current).toBe('public')
    })

    it('returns "checking" while the dataset list is still loading', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: null})
      expect(renderPolicy(makeClient('production'), PLAIN_SOURCE).current).toBe('checking')
    })

    it('falls back to "public" when the dataset is not in the project list', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [makeDataset('production', 'private')]})
      expect(renderPolicy(makeClient('staging'), PLAIN_SOURCE).current).toBe('public')
    })

    it('falls back to "public" when the client has no dataset configured', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [makeDataset('production', 'private')]})
      expect(renderPolicy(makeClient(), PLAIN_SOURCE).current).toBe('public')
    })
  })

  describe('Media Library sources', () => {
    it('returns "unknown" for cookie-auth clients (no token)', () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [makeDataset('production', 'private')]})
      expect(renderPolicy(makeClient('production'), ML_SOURCE).current).toBe('unknown')
      expect(enqueueAssetAccessPolicyFetch).not.toHaveBeenCalled()
    })

    it('resolves the per-asset cdnAccessPolicy when the client has a token', async () => {
      vi.mocked(useProjectDatasets).mockReturnValue({value: [makeDataset('production', 'private')]})
      vi.mocked(enqueueAssetAccessPolicyFetch).mockResolvedValue('private')

      const result = renderPolicy(makeClient('production', 'tok'), ML_SOURCE)

      await waitFor(() => expect(result.current).toBe('private'))
      expect(enqueueAssetAccessPolicyFetch).toHaveBeenCalledWith(
        makeMediaLibraryRef(LIB_ID, ASSET_ID),
        expect.anything(),
      )
    })
  })
})
