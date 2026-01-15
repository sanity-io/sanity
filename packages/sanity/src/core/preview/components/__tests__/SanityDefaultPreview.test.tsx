import {isSanityImageUrl, parseImageAssetUrl} from '@sanity/asset-utils'
import {createImageUrlBuilder} from '@sanity/image-url'
import {render} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useImageUrl} from '../../../form/inputs/files/ImageInput/useImageUrl'
import {useClient} from '../../../hooks'
import {_previewComponents} from '../_previewComponents'
import {SanityDefaultPreview} from '../SanityDefaultPreview'

vi.mock('@sanity/asset-utils')
vi.mock('../../../hooks')
vi.mock('../../../form/inputs/files/ImageInput/useImageUrl')
vi.mock('@sanity/image-url')

let capturedMedia: unknown

vi.mock('../_previewComponents', () => ({
  _previewComponents: {
    default: vi.fn((props: {media?: unknown}) => {
      capturedMedia = props.media
      return null
    }),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  capturedMedia = undefined

  vi.mocked(useClient).mockReturnValue({} as ReturnType<typeof useClient>)
  vi.mocked(createImageUrlBuilder).mockReturnValue({} as ReturnType<typeof createImageUrlBuilder>)
  vi.mocked(useImageUrl).mockReturnValue({
    url: 'https://cdn.sanity.io/transformed.jpg',
    isLoading: false,
  })
})

function renderPreview(media: unknown): void {
  render(<SanityDefaultPreview layout="default" media={media} title="Test" />)
}

describe('SanityDefaultPreview - Sanity URL handling (fix/edx-1307)', () => {
  it('should handle valid Sanity image URL strings without crashing', () => {
    const sanityUrl = 'https://cdn.sanity.io/images/project/dataset/abc123-1920x1080.jpg'

    vi.mocked(isSanityImageUrl).mockReturnValue(true)
    vi.mocked(parseImageAssetUrl).mockReturnValue({
      assetId: 'image-abc123-1920x1080-jpg',
      projectId: 'project',
      dataset: 'dataset',
      type: 'image',
      width: 1920,
      height: 1080,
    })

    vi.mocked(_previewComponents.default).mockImplementation((props: {media?: unknown}) => {
      capturedMedia = props.media
      if (typeof capturedMedia === 'function') {
        capturedMedia({dimensions: {width: 100, height: 100, fit: 'crop', dpr: 1}})
      }
      return null
    })

    renderPreview(sanityUrl)

    expect(isSanityImageUrl).toHaveBeenCalledWith(sanityUrl)
    expect(typeof capturedMedia).toBe('function')
    expect(parseImageAssetUrl).toHaveBeenCalled()
  })

  it('should handle malformed/invalid Sanity-like URL strings gracefully', () => {
    const invalidUrl = 'https://not-a-sanity-url.com/image.jpg'

    vi.mocked(isSanityImageUrl).mockReturnValue(false)

    renderPreview(invalidUrl)

    expect(parseImageAssetUrl).toHaveBeenCalledTimes(0)
    expect(capturedMedia).toBe(invalidUrl)
  })

  it('should handle valid image sources (asset objects) as before', () => {
    vi.mocked(isSanityImageUrl).mockReturnValue(false)

    const imageSource = {
      _type: 'image',
      asset: {_ref: 'image-abc123-1920x1080-jpg', _type: 'reference'},
    }

    renderPreview(imageSource)

    expect(typeof capturedMedia).toBe('function')
    expect(parseImageAssetUrl).toHaveBeenCalledTimes(0)
  })
})
