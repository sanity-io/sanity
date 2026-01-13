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
vi.mock('../_previewComponents', () => ({
  _previewComponents: {
    default: vi.fn(() => null),
  },
}))

describe('SanityDefaultPreview - Sanity URL handling (fix/edx-1307)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useClient).mockReturnValue({} as unknown as ReturnType<typeof useClient>)
    vi.mocked(createImageUrlBuilder).mockReturnValue(
      {} as unknown as ReturnType<typeof createImageUrlBuilder>,
    )
    vi.mocked(useImageUrl).mockReturnValue({
      url: 'https://cdn.sanity.io/transformed.jpg',
      isLoading: false,
    })
  })

  it('should handle valid Sanity image URL strings without crashing', () => {
    vi.mocked(isSanityImageUrl).mockReturnValue(true)
    vi.mocked(parseImageAssetUrl).mockReturnValue({
      assetId: 'image-abc123-1920x1080-jpg',
      width: 1920,
      height: 1080,
      format: 'jpg',
    } as unknown as ReturnType<typeof parseImageAssetUrl>)

    let capturedMedia: unknown
    vi.mocked(_previewComponents.default).mockImplementation((props: {media?: unknown}) => {
      capturedMedia = props.media
      if (typeof capturedMedia === 'function') {
        capturedMedia({dimensions: {width: 100, height: 100, fit: 'crop', dpr: 1}})
      }
      return null
    })

    render(
      <SanityDefaultPreview
        layout="default"
        media="https://cdn.sanity.io/images/project/dataset/abc123-1920x1080.jpg"
        title="Test"
      />,
    )

    expect(isSanityImageUrl).toHaveBeenCalledWith(
      'https://cdn.sanity.io/images/project/dataset/abc123-1920x1080.jpg',
    )
    expect(typeof capturedMedia).toBe('function')
    expect(parseImageAssetUrl).toHaveBeenCalled()
  })

  it('should handle malformed/invalid Sanity-like URL strings gracefully', () => {
    vi.mocked(isSanityImageUrl).mockReturnValue(false)

    let capturedMedia: unknown
    vi.mocked(_previewComponents.default).mockImplementation((props: {media?: unknown}) => {
      capturedMedia = props.media
      return null
    })

    expect(() => {
      render(
        <SanityDefaultPreview
          layout="default"
          media="https://not-a-sanity-url.com/image.jpg"
          title="Test"
        />,
      )
    }).not.toThrow()

    expect(parseImageAssetUrl).not.toHaveBeenCalled()
    expect(capturedMedia).toBe('https://not-a-sanity-url.com/image.jpg')
  })

  it('should handle valid image sources (asset objects) as before', () => {
    vi.mocked(isSanityImageUrl).mockReturnValue(false)

    const imageSource = {
      _type: 'image',
      asset: {_ref: 'image-abc123-1920x1080-jpg', _type: 'reference'},
    }

    let capturedMedia: unknown
    vi.mocked(_previewComponents.default).mockImplementation((props: {media?: unknown}) => {
      capturedMedia = props.media
      return null
    })

    render(<SanityDefaultPreview layout="default" media={imageSource} title="Test" />)

    expect(typeof capturedMedia).toBe('function')
    expect(parseImageAssetUrl).not.toHaveBeenCalled()
  })
})
