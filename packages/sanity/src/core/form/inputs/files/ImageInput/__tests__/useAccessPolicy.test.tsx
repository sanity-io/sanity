import {type SanityClient} from '@sanity/client'
import {renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {enqueueAssetAccessPolicyFetch} from '../../../../../store/accessPolicy/fetch'
import {useAccessPolicy} from '../useAccessPolicy'

vi.mock('../../../../../store/accessPolicy/fetch', () => ({
  enqueueAssetAccessPolicyFetch: vi.fn(),
}))

const fetchMock = vi.mocked(enqueueAssetAccessPolicyFetch)
const SOURCE = {media: {_ref: 'media-library:lib1:asset1'}}

/** A client whose credential is only known through `getAuth()`, like one with a reactive `auth`. */
function createClient(auth: {token?: string; withCredentials?: true}): SanityClient {
  return {
    config: () => ({projectId: 'p', dataset: 'd'}),
    getAuth: vi.fn(async () => auth),
  } as unknown as SanityClient
}

describe('useAccessPolicy', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('checks the policy with the token the client resolves through getAuth()', async () => {
    fetchMock.mockResolvedValue('private')
    const client = createClient({token: 'token-1'})

    const {result} = renderHook(() => useAccessPolicy({client, source: SOURCE}))

    await waitFor(() => expect(result.current).toBe('private'))
    expect(fetchMock).toHaveBeenCalledWith('media-library:lib1:asset1', client)
  })

  it('does not check with a cookie-authenticated client', async () => {
    const client = createClient({withCredentials: true})

    const {result} = renderHook(() => useAccessPolicy({client, source: SOURCE}))

    await waitFor(() => expect(result.current).toBe('unknown'))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('treats assets outside the media library as public', () => {
    const client = createClient({token: 'token-1'})

    const {result} = renderHook(() =>
      useAccessPolicy({client, source: {_type: 'image', asset: {_ref: 'image-abc-100x100-png'}}}),
    )

    expect(result.current).toBe('public')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
