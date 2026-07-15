import {describe, expect, it} from 'vitest'

import {getVideoPlaybackInfoRequest} from '../useVideoPlaybackInfo'

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
      uri: '/media-libraries/library-id/video/video-instance-id/playback-info',
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
      uri: '/media-libraries/library-id/video/video-instance-id/playback-info',
      tag: 'media-library.video-playback-info',
    })
  })
})
