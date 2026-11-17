import {act, renderHook, waitFor} from '@testing-library/react'
import {of, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useClient} from '../../../../core/hooks/useClient'
import {getVideoPlaybackInfoRequest, useVideoPlaybackInfo} from '../useVideoPlaybackInfo'

vi.mock('../../../../core/hooks/useClient')

const playbackInfo = {
  id: 'playback-id',
  thumbnail: {url: 'https://image.example/thumbnail.jpg'},
  animated: {url: ''},
  storyboard: {url: ''},
  stream: {url: ''},
  duration: 1,
  aspectRatio: 2,
}

const params = {
  mediaLibraryId: 'library-id',
  assetRef: {
    _type: 'globalDocumentReference' as const,
    _ref: 'media-library:library-id:video-instance-id',
  },
}

function notFoundError() {
  return Object.assign(new Error('Not found'), {statusCode: 404})
}

function mockClient(overrides: {
  request: ReturnType<typeof vi.fn>
  observableRequest?: ReturnType<typeof vi.fn>
}) {
  const mock = {
    request: overrides.request,
    observable: {request: overrides.observableRequest ?? vi.fn()},
  }
  // oxlint-disable-next-line typescript/no-deprecated -- test mock of useClient return type
  vi.mocked(useClient).mockReturnValue(mock as unknown as ReturnType<typeof useClient>)
}

describe('getVideoPlaybackInfoRequest', () => {
  it('targets the pinned asset instance and requests thumbnail transformations', () => {
    expect(
      getVideoPlaybackInfoRequest({
        mediaLibraryId: 'library-id',
        assetRef: {
          _type: 'globalDocumentReference',
          _ref: 'media-library:library-id:video-instance-id',
        },
        thumbnail: {width: 301, height: 201, fit: 'smartcrop'},
      }),
    ).toEqual({
      url: '/media-libraries/library-id/video/video-instance-id/playback-info',
      tag: 'media-library.video-playback-info',
      query: {
        thumbnailWidth: '301',
        thumbnailHeight: '201',
        thumbnailFit: 'smartcrop',
      },
    })
  })

  it('omits thumbnail query parameters for existing callers', () => {
    expect(
      getVideoPlaybackInfoRequest({
        mediaLibraryId: 'library-id',
        assetRef: {
          _type: 'globalDocumentReference',
          _ref: 'media-library:library-id:video-instance-id',
        },
      }),
    ).toEqual({
      url: '/media-libraries/library-id/video/video-instance-id/playback-info',
      tag: 'media-library.video-playback-info',
    })
  })
})

describe('useVideoPlaybackInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns playback info when the request succeeds', async () => {
    const request = vi.fn().mockResolvedValue(playbackInfo)
    mockClient({request})

    const {result} = renderHook(() => useVideoPlaybackInfo(params))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.result).toEqual(playbackInfo)
    expect(result.current.error).toBeUndefined()
    expect(request).toHaveBeenCalledOnce()
  })

  it(
    'retries a bounded number of times when playback-info 404s after the asset is ready',
    {timeout: 10_000},
    async () => {
      vi.useFakeTimers()

      const request = vi.fn().mockRejectedValue(notFoundError())
      const observableRequest = vi.fn().mockReturnValue(
        of({
          documents: [{_id: 'video-instance-id', _type: 'sanity.videoAsset', state: 'ready'}],
        }),
      )
      mockClient({request, observableRequest})

      const {result} = renderHook(() => useVideoPlaybackInfo(params))

      // Initial attempt + 5 retries, each waiting PLAYBACK_INFO_RETRY_DELAY after ready.
      for (let i = 0; i < 6; i++) {
        await act(async () => {
          await Promise.resolve()
          await vi.advanceTimersByTimeAsync(2_000)
        })
      }

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(request).toHaveBeenCalledTimes(6)
      expect(observableRequest).toHaveBeenCalled()
    },
  )

  it('does not retry non-404 playback-info failures', async () => {
    const request = vi.fn().mockRejectedValue(new Error('server error'))
    const observableRequest = vi.fn()
    mockClient({request, observableRequest})

    const {result} = renderHook(() => useVideoPlaybackInfo(params))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error?.message).toBe('server error')
    })

    expect(request).toHaveBeenCalledOnce()
    expect(observableRequest).not.toHaveBeenCalled()
  })

  it('surfaces a fatal error when the asset fails processing', async () => {
    const request = vi.fn().mockRejectedValue(notFoundError())
    const observableRequest = vi
      .fn()
      .mockReturnValue(throwError(() => new Error('Asset state is not "ready": failed')))
    mockClient({request, observableRequest})

    const {result} = renderHook(() => useVideoPlaybackInfo(params))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeTruthy()
    })

    expect(request).toHaveBeenCalledOnce()
  })
})
