import {describe, expect, it} from 'vitest'

import {isVideoAssetSource, parseVideoAssetSource} from '../isVideoAssetSource'

const videoValue = {
  _type: 'sanity.video',
  asset: {
    _type: 'globalDocumentReference',
    _ref: 'media-library:library-id:video-instance-id',
  },
}

describe('parseVideoAssetSource', () => {
  it('parses the pinned video instance reference', () => {
    expect(parseVideoAssetSource(videoValue)).toEqual({
      mediaLibraryId: 'library-id',
      assetRef: videoValue.asset,
    })
  })

  it.each([
    undefined,
    {},
    {...videoValue, _type: 'sanity.image'},
    {...videoValue, asset: {...videoValue.asset, _ref: 'media-library::video-instance-id'}},
    {...videoValue, asset: {...videoValue.asset, _ref: 'media-library:library-id:'}},
    {...videoValue, asset: {...videoValue.asset, _ref: 'other:library-id:video-instance-id'}},
  ])('rejects non-video and malformed values', (value) => {
    expect(parseVideoAssetSource(value)).toBeNull()
    expect(isVideoAssetSource(value)).toBe(false)
  })
})

describe('isVideoAssetSource', () => {
  it('accepts a normalized sanity.video value', () => {
    expect(isVideoAssetSource(videoValue)).toBe(true)
  })

  it('accepts opaque Media Library instance IDs', () => {
    expect(
      isVideoAssetSource({
        ...videoValue,
        asset: {...videoValue.asset, _ref: 'media-library:library-id:instance-xyz'},
      }),
    ).toBe(true)
  })
})
