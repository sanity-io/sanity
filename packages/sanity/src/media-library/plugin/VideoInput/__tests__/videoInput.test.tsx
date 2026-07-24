/**
 * VideoInput-specific tests.
 * Asset source behavior is covered in assetSourceIntegration.test.tsx.
 * Drag-to-upload is covered in common/__tests__/uploadTarget.test.tsx.
 */
import {screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {
  createMockAssetSourceWithMediaLibraryUploader,
  observeVideoAssetStub,
} from '../../../../../test/fixtures/assetSourceMocks'
import {renderVideoInput} from '../../../../../test/form'
import {getDataTestIdPrefix} from '../../../../core/form/inputs/files/common/AssetSourceBrowser'
import {StudioVideoInput} from '../StudioVideoInput'
import {BaseVideoInput} from '../VideoInput'

// Mock useVideoPlaybackInfo so VideoPreview shows the options menu instead of waiting for API
vi.mock('../useVideoPlaybackInfo', () => ({
  useVideoPlaybackInfo: () => ({
    isLoading: false,
    result: {
      id: 'test',
      thumbnail: {url: 'https://example.com/thumb.jpg'},
      animated: {url: 'https://example.com/animated.gif'},
      storyboard: {url: 'https://example.com/storyboard.jpg'},
      stream: {url: 'https://example.com/stream.m3u8'},
      duration: 60,
      aspectRatio: 16 / 9,
    },
    error: undefined,
    retry: () => {},
  }),
}))

// Mock VideoPlayer to avoid loading @mux/mux-player-react and media-chrome (slow startup)
vi.mock('../VideoPlayer', () => ({
  VideoPlayer: () => null,
}))

describe('VideoInput - local tests', () => {
  it('renders upload and browse when asset sources are present', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    await renderVideoInput({
      assetSources: [assetSource],
      fieldDefinition: {name: 'someVideo', title: 'A video', type: 'sanity.video'},
      observeAsset: observeVideoAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} />,
    })

    expect(screen.getByTestId('file-input-upload-button-media-library-mock')).toBeInTheDocument()
    expect(
      screen.getByTestId(
        `${getDataTestIdPrefix({name: 'sanity.video', jsonType: 'object'})}-browse-button-media-library-mock`,
      ),
    ).toBeInTheDocument()
  })

  it('renders browse button right-aligned when disableNew is true', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()
    const videoBrowseTestId = `${getDataTestIdPrefix({name: 'sanity.video', jsonType: 'object'})}-browse-button-media-library-mock`

    await renderVideoInput({
      assetSources: [assetSource],
      fieldDefinition: {
        name: 'someVideo',
        title: 'A video',
        type: 'sanity.video',
        options: {disableNew: true},
      },
      observeAsset: observeVideoAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} />,
    })

    expect(screen.getByTestId(videoBrowseTestId)).toBeInTheDocument()
    expect(
      screen.queryByTestId('file-input-upload-button-media-library-mock'),
    ).not.toBeInTheDocument()

    const browseButton = screen.getByTestId(videoBrowseTestId)
    const flexContainer = browseButton.closest('[data-ui="Flex"]')
    expect(flexContainer).toBeInTheDocument()
    expect(flexContainer).toHaveStyle('justify-content: flex-end')
  })

  it('StudioVideoInput hides upload when disableNew is true', async () => {
    const videoBrowseTestId = `${getDataTestIdPrefix({name: 'sanity.video', jsonType: 'object'})}-browse-button-sanity-media-library`

    await renderVideoInput({
      fieldDefinition: {
        name: 'someVideo',
        title: 'A video',
        type: 'sanity.video',
        options: {disableNew: true},
      },
      observeAsset: observeVideoAssetStub,
      render: (inputProps) => {
        const {
          assetSources: _assetSources,
          client: _client,
          directUploads: _directUploads,
          observeAsset: _observeAsset,
          resolveUploader: _resolveUploader,
          // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
          t: _t,
          ...studioProps
        } = inputProps
        return <StudioVideoInput {...studioProps} />
      },
    })

    expect(screen.getByTestId(videoBrowseTestId)).toBeInTheDocument()
    expect(
      screen.queryByTestId('file-input-upload-button-sanity-media-library'),
    ).not.toBeInTheDocument()
  })

  it('shows invalid video warning when asset ref is not a media-library ref', async () => {
    const invalidValue = {
      _type: 'sanity.video',
      asset: {_ref: 'file-invalid-asset', _type: 'reference'},
    }
    await renderVideoInput({
      fieldDefinition: {name: 'someVideo', title: 'A video', type: 'sanity.video'},
      observeAsset: observeVideoAssetStub,
      props: {documentValue: {someVideo: invalidValue}},
      render: (inputProps) => <BaseVideoInput {...inputProps} value={invalidValue} />,
    })
    expect(screen.getByTestId('invalid-video-warning')).toBeInTheDocument()
  })

  it('renders video preview when asset has media-library ref format', async () => {
    const value = {
      asset: {
        _ref: 'media-library:org123:asset789',
        _type: 'reference',
      },
      _type: 'sanity.video',
    }
    await renderVideoInput({
      fieldDefinition: {name: 'someVideo', title: 'A video', type: 'sanity.video'},
      observeAsset: observeVideoAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} value={value} />,
    })
    await waitFor(() => {
      const optionsMenu = screen.queryByTestId('options-menu-button')
      const stubFilename = screen.queryByText('stub.mp4')
      expect(optionsMenu ?? stubFilename).toBeTruthy()
    })
  })
})
