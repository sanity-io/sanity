import {studioTheme, ThemeProvider} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {type VideoPlaybackInfoLoadable} from '../../VideoInput/useVideoPlaybackInfo'
import {
  getVideoThumbnailParams,
  VideoThumbnailContent,
  type VideoThumbnailProps,
} from '../VideoThumbnail'

const dimensions: VideoThumbnailProps['dimensions'] = {width: 100.1, height: 50.1, dpr: 2}
const value: VideoThumbnailProps['value'] = {
  _type: 'sanity.video',
  asset: {
    _type: 'globalDocumentReference',
    _ref: 'media-library:library-id:video-instance-id',
  },
}

function renderContent(state: VideoPlaybackInfoLoadable) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <VideoThumbnailContent state={state} />
    </ThemeProvider>,
  )
}

describe('getVideoThumbnailParams', () => {
  it('converts CSS dimensions to ceil device pixels and requests smartcrop', () => {
    expect(getVideoThumbnailParams(value, dimensions)).toEqual({
      mediaLibraryId: 'library-id',
      assetRef: value.asset,
      thumbnail: {width: 201, height: 101, fit: 'smartcrop'},
    })
  })
})

describe('VideoThumbnailContent', () => {
  it('renders a skeleton while playback info is loading', () => {
    renderContent({
      isLoading: true,
      result: undefined,
      error: undefined,
      retry: vi.fn(),
    })

    expect(screen.getByTestId('video-thumbnail-loading')).toBeInTheDocument()
  })

  it('renders the playback thumbnail without adding transformations client-side', () => {
    renderContent({
      isLoading: false,
      result: {
        id: 'playback-id',
        thumbnail: {url: 'https://image.example/thumbnail.jpg?width=201'},
        animated: {url: ''},
        storyboard: {url: ''},
        stream: {url: ''},
        duration: 1,
        aspectRatio: 2,
      },
      error: undefined,
      retry: vi.fn(),
    })

    expect(screen.getByTestId('video-thumbnail-image')).toHaveAttribute(
      'src',
      'https://image.example/thumbnail.jpg?width=201',
    )
  })

  it('adds a signed thumbnail token with URL encoding', () => {
    renderContent({
      isLoading: false,
      result: {
        id: 'playback-id',
        thumbnail: {url: 'https://image.example/thumbnail.jpg?width=201', token: 'a+b&c=d'},
        animated: {url: '', token: ''},
        storyboard: {url: '', token: ''},
        stream: {url: '', token: ''},
        duration: 1,
        aspectRatio: 2,
      },
      error: undefined,
      retry: vi.fn(),
    })

    const thumbnailUrl = new URL(screen.getByTestId('video-thumbnail-image').getAttribute('src')!)
    expect(thumbnailUrl.searchParams.get('width')).toBe('201')
    expect(thumbnailUrl.searchParams.get('token')).toBe('a+b&c=d')
  })

  it('renders a fallback when playback fails', () => {
    renderContent({
      isLoading: false,
      result: undefined,
      error: new Error('request failed'),
      retry: vi.fn(),
    })

    expect(screen.getByTestId('video-thumbnail-fallback')).toBeInTheDocument()
  })

  it('renders a fallback when the thumbnail image fails', () => {
    renderContent({
      isLoading: false,
      result: {
        id: 'playback-id',
        thumbnail: {url: 'https://image.example/thumbnail.jpg'},
        animated: {url: ''},
        storyboard: {url: ''},
        stream: {url: ''},
        duration: 1,
        aspectRatio: 2,
      },
      error: undefined,
      retry: vi.fn(),
    })

    fireEvent.error(screen.getByTestId('video-thumbnail-image'))

    expect(screen.getByTestId('video-thumbnail-fallback')).toBeInTheDocument()
  })
})
