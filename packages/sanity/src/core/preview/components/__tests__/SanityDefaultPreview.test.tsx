import {
  isImageSource,
  isSanityImageUrl,
  parseImageAssetUrl,
  tryGetImageDimensions,
} from '@sanity/asset-utils'
import {createImageUrlBuilder} from '@sanity/image-url'
import {render} from '@testing-library/react'
import {type ComponentType} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {VideoThumbnail} from '../../../../media-library/plugin/preview/VideoThumbnail'
import {type PreviewMediaDimensions, type PreviewProps} from '../../../components/previews'
import {useImageUrl} from '../../../form/inputs/files/ImageInput/useImageUrl'
import {useClient} from '../../../hooks'
import {_previewComponents} from '../_previewComponents'
import {SanityDefaultPreview} from '../SanityDefaultPreview'

vi.mock('@sanity/asset-utils')
vi.mock('../../../hooks')
vi.mock('../../../form/inputs/files/ImageInput/useImageUrl')
vi.mock('@sanity/image-url')
vi.mock('../../../../media-library/plugin/preview/VideoThumbnail', () => ({
  VideoThumbnail: vi.fn(() => null),
}))

let capturedMedia: unknown
let capturedMediaDimensions: PreviewMediaDimensions | undefined

vi.mock('../_previewComponents', () => {
  const captureProps = (props: {media?: unknown; mediaDimensions?: PreviewMediaDimensions}) => {
    capturedMedia = props.media
    capturedMediaDimensions = props.mediaDimensions
    return null
  }
  return {
    _previewComponents: {
      default: vi.fn(captureProps),
      blockImage: vi.fn(captureProps),
    },
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  capturedMedia = undefined
  capturedMediaDimensions = undefined

  vi.mocked(useClient).mockReturnValue({} as ReturnType<typeof useClient>)
  vi.mocked(createImageUrlBuilder).mockReturnValue({} as ReturnType<typeof createImageUrlBuilder>)
  vi.mocked(useImageUrl).mockReturnValue({
    url: 'https://cdn.sanity.io/transformed.jpg',
    isLoading: false,
  })
})

function renderPreview(media: PreviewProps['media']): void {
  render(<SanityDefaultPreview layout="default" media={media} title="Test" />)
}

function renderBlockImagePreview(
  media: PreviewProps['media'],
  mediaDimensions?: PreviewMediaDimensions,
): void {
  render(
    <SanityDefaultPreview
      layout="blockImage"
      media={media}
      mediaDimensions={mediaDimensions}
      title="Test"
    />,
  )
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

describe('SanityDefaultPreview - video media', () => {
  const asset = {
    _type: 'globalDocumentReference' as const,
    _ref: 'media-library:library-id:video-asset-instance-id',
    _resource: {type: 'media-library' as const, id: 'library-id'},
  }
  const media = {
    _type: 'globalDocumentReference' as const,
    _ref: 'media-library:library-id:asset-container-id',
    _resource: {type: 'media-library' as const, id: 'library-id'},
  }

  it('renders a thumbnail for a normalized sanity.video media value', () => {
    const video = {_type: 'sanity.video' as const, asset, media}
    const dimensions = {width: 160, height: 90, fit: 'crop' as const, dpr: 2}

    renderPreview(video)

    expect(typeof capturedMedia).toBe('function')
    const VideoMediaPreview = capturedMedia as ComponentType<{
      dimensions: PreviewMediaDimensions
    }>
    render(<VideoMediaPreview dimensions={dimensions} />)
    expect(VideoThumbnail).toHaveBeenCalledOnce()
    expect(vi.mocked(VideoThumbnail).mock.calls[0]?.[0]).toEqual({value: video, dimensions})
  })

  it('does not treat a bare media library reference as a video', () => {
    renderPreview(asset)

    expect(typeof capturedMedia).toBe('function')
    const FallbackMedia = capturedMedia as ComponentType
    render(<FallbackMedia />)
    expect(VideoThumbnail).not.toHaveBeenCalled()
  })
})

describe('SanityDefaultPreview - blockImage media dimensions', () => {
  it('should resolve actual image dimensions for blockImage layout', () => {
    vi.mocked(isSanityImageUrl).mockReturnValue(false)
    vi.mocked(isImageSource).mockReturnValue(true)
    vi.mocked(tryGetImageDimensions).mockReturnValue({
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
    })

    const imageSource = {
      _type: 'image',
      asset: {_ref: 'image-abc123-1920x1080-jpg', _type: 'reference'},
    }

    renderBlockImagePreview(imageSource)

    expect(tryGetImageDimensions).toHaveBeenCalledWith(imageSource)
    // 1920 -> capped to 600 (PREVIEW_SIZES.blockImage.media.width)
    expect(capturedMediaDimensions?.width).toBe(600)
    // 1080 * (600/1920) = 337.5 -> rounded to 338
    expect(capturedMediaDimensions?.height).toBe(338)
    expect(capturedMediaDimensions?.fit).toBe('max')
  })

  it('should not override mediaDimensions for non-blockImage layouts', () => {
    vi.mocked(isSanityImageUrl).mockReturnValue(false)
    vi.mocked(isImageSource).mockReturnValue(true)
    vi.mocked(tryGetImageDimensions).mockReturnValue({
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
    })

    const imageSource = {
      _type: 'image',
      asset: {_ref: 'image-abc123-1920x1080-jpg', _type: 'reference'},
    }

    renderPreview(imageSource)

    expect(capturedMediaDimensions).toBeUndefined()
  })

  it('should respect caller-provided mediaDimensions for blockImage layout', () => {
    vi.mocked(isSanityImageUrl).mockReturnValue(false)
    vi.mocked(isImageSource).mockReturnValue(true)
    vi.mocked(tryGetImageDimensions).mockReturnValue({
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
    })

    const imageSource = {
      _type: 'image',
      asset: {_ref: 'image-abc123-1920x1080-jpg', _type: 'reference'},
    }

    const explicitDimensions: PreviewMediaDimensions = {
      width: 200,
      height: 150,
      fit: 'crop',
    }

    renderBlockImagePreview(imageSource, explicitDimensions)

    expect(capturedMediaDimensions).toEqual(explicitDimensions)
    expect(tryGetImageDimensions).not.toHaveBeenCalled()
  })

  it('should gracefully fall back when image dimensions cannot be resolved', () => {
    vi.mocked(isSanityImageUrl).mockReturnValue(false)
    vi.mocked(isImageSource).mockReturnValue(true)
    vi.mocked(tryGetImageDimensions).mockReturnValue(undefined)

    const imageSource = {
      _type: 'image',
      asset: {_ref: 'image-broken', _type: 'reference'},
    }

    renderBlockImagePreview(imageSource)

    expect(capturedMediaDimensions).toBeUndefined()
  })
})
