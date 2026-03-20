/**
 * Parameterized integration tests for asset sources across Image, File, and Video inputs.
 * Tests the shared asset source behavior: upload flow, browse flow, empty state, no sources fallback.
 */
import {createImageUrlBuilder} from '@sanity/image-url'
import {type AssetSource} from '@sanity/types'
import {screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {
  createMockAssetSourceWithMediaLibraryUploader,
  observeFileAssetStub,
  observeImageAssetStub,
  observeVideoAssetStub,
} from '../../../../../../test/fixtures/assetSourceMocks'
import {renderFileInput, renderImageInput, renderVideoInput} from '../../../../../../test/form'
import {BaseVideoInput} from '../../../../../media-library/plugin/VideoInput/VideoInput'
import {MediaLibraryUploader} from '../../../studio/assetSourceMediaLibrary/uploader'
import {getDataTestIdPrefix} from '../common/AssetSourceBrowser'
import {BaseFileInput} from '../FileInput'
import {BaseImageInput} from '../ImageInput'

function getBrowseTestId(schemaTypeName: string, sourceName: string): string {
  const prefix = getDataTestIdPrefix({name: schemaTypeName, jsonType: 'object'})
  return `${prefix}-browse-button-${sourceName}`
}

function getBrowseTestIdSingleSource(schemaTypeName: string): string {
  const prefix = getDataTestIdPrefix({name: schemaTypeName, jsonType: 'object'})
  return `${prefix}-browse-button`
}

function getMultiBrowseTestId(schemaTypeName: string): string {
  const prefix = getDataTestIdPrefix({name: schemaTypeName, jsonType: 'object'})
  return `${prefix}-multi-browse-button`
}

// Mock useVideoPlaybackInfo so VideoPreview shows the options menu instead of waiting for API
vi.mock('../../../../../media-library/plugin/VideoInput/useVideoPlaybackInfo', () => ({
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
    retry: () => {
      /* intentionally empty */
    },
  }),
}))

// Mock VideoPlayer to avoid loading @mux/mux-player-react and media-chrome (slow startup)
vi.mock('../../../../../media-library/plugin/VideoInput/VideoPlayer', () => ({
  VideoPlayer: () => null,
}))

const INPUT_CONFIGS = [
  {
    inputType: 'file',
    uploadTestId: 'file-input-upload-button-media-library-mock',
    fieldDefinition: {
      name: 'someFile',
      title: 'A file',
      type: 'file',
    },
    render: renderFileInput,
    BaseInput: BaseFileInput,
    observeAsset: observeFileAssetStub,
  },
  {
    inputType: 'image',
    uploadTestId: 'file-input-upload-button-media-library-mock',
    fieldDefinition: {
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
    },
    render: renderImageInput,
    BaseInput: BaseImageInput,
    observeAsset: observeImageAssetStub,
  },
  {
    inputType: 'video',
    uploadTestId: 'file-input-upload-button-media-library-mock',
    fieldDefinition: {
      name: 'someVideo',
      title: 'A video',
      type: 'sanity.video',
    },
    render: renderVideoInput,
    BaseInput: BaseVideoInput,
    observeAsset: observeVideoAssetStub,
  },
] as const

describe.each(INPUT_CONFIGS)(
  'Asset source integration - $inputType',
  ({
    inputType: _inputType,
    uploadTestId,
    fieldDefinition,
    render: renderFn,
    BaseInput,
    observeAsset,
  }) => {
    it('renders upload and browse buttons when asset sources are present', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader()

      await renderFn({
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        // inputProps type varies by renderFn (File vs Image); cast satisfies union in describe.each
        render: (inputProps) => <BaseInput {...(inputProps as any)} />,
      })

      expect(screen.getByTestId(uploadTestId)).toBeInTheDocument()
      expect(
        screen.getByTestId(getBrowseTestId(fieldDefinition.type, assetSource.name)),
      ).toBeInTheDocument()
    })

    it('completes upload and receives selection when asset source signals completion', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader()

      const {onChange} = await renderFn({
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        // inputProps type varies by renderFn (File vs Image); cast satisfies union in describe.each
        render: (inputProps) => <BaseInput {...(inputProps as any)} />,
      })

      // Use a file type that matches each input's accept attribute (video/* for video, etc.)
      const file =
        _inputType === 'video'
          ? new File(['content'], 'test.mp4', {type: 'video/mp4'})
          : new File(['content'], 'test.pdf', {type: 'application/pdf'})
      const uploadButton = screen.getByTestId(uploadTestId)
      // eslint-disable-next-line testing-library/no-node-access -- hidden file input has no accessible role
      let fileInput = uploadButton.querySelector('input[type="file"]') as HTMLInputElement | null
      // Single source: FileInputButton has embedded input. Multiple sources: UploadDropDownMenu uses
      // imperative openFilePicker - click button to open menu, then click menu item to create input.
      if (!fileInput) {
        await userEvent.click(uploadButton)
        // If a dropdown opened, click the first upload menu item to trigger file picker
        const menuItem = screen.queryByTestId('file-input-upload-button-0')
        if (menuItem) {
          await userEvent.click(menuItem)
        }
        fileInput = await screen.findByTestId('open-file-picker-input')
      }
      expect(fileInput).toBeInTheDocument()

      await userEvent.upload(fileInput, file)

      await waitFor(
        () => {
          const calls = onChange.mock.calls
          expect(calls.length).toBeGreaterThanOrEqual(1)
          const getPatches = (call: unknown[]) => {
            const arg = call[0]
            return Array.isArray(arg) ? arg : (arg as {patches?: unknown[]})?.patches
          }
          const hasAssetPatch = calls.some((call) => {
            const patches = getPatches(call)
            if (!Array.isArray(patches)) return false
            return patches.some((patch: unknown) => {
              const p = patch as {path?: string[]}
              return Array.isArray(p?.path) && p.path?.includes('asset')
            })
          })
          expect(hasAssetPatch).toBe(true)
        },
        {timeout: 10000},
      )

      // Verify reset: a second upload should work. Without signalCompletion the input would stay stuck.
      const file2 =
        _inputType === 'video'
          ? new File(['more content'], 'test2.mp4', {type: 'video/mp4'})
          : new File(['more content'], 'test2.pdf', {type: 'application/pdf'})
      // Input may have been removed after first upload (imperative flow); click again to create new one
      // eslint-disable-next-line testing-library/no-node-access -- hidden file input has no accessible role
      let fileInput2 = uploadButton.querySelector('input[type="file"]') as HTMLInputElement | null
      if (!fileInput2) {
        await userEvent.click(uploadButton)
        const menuItem = screen.queryByTestId('file-input-upload-button-0')
        if (menuItem) {
          await userEvent.click(menuItem)
        }
        fileInput2 = await screen.findByTestId('open-file-picker-input')
      }
      await userEvent.upload(fileInput2, file2)
      await waitFor(
        () => {
          const hasSecondAssetPatch = onChange.mock.calls.some((call) => {
            const arg = call[0]
            const patches = Array.isArray(arg) ? arg : (arg as {patches?: unknown[]})?.patches
            if (!Array.isArray(patches)) return false
            return patches.some((patch: unknown) => {
              const p = patch as {path?: string[]}
              return Array.isArray(p?.path) && p.path?.includes('asset')
            })
          })
          expect(hasSecondAssetPatch).toBe(true)
        },
        {timeout: 10000},
      )
    }, 15000)

    it('can browse and select an asset from empty state', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader()

      const {onChange} = await renderFn({
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        // inputProps type varies by renderFn (File vs Image); cast satisfies union in describe.each
        render: (inputProps) => <BaseInput {...(inputProps as any)} />,
      })

      const browseButton = screen.getByTestId(
        getBrowseTestId(fieldDefinition.type, assetSource.name),
      )
      await userEvent.click(browseButton)

      await waitFor(
        () => {
          const hasBrowseAssetPatch = onChange.mock.calls.some((call) => {
            const arg = call[0]
            const patches = Array.isArray(arg) ? arg : (arg as {patches?: unknown[]})?.patches
            if (!Array.isArray(patches)) return false
            return patches.some((patch: unknown) => {
              const p = patch as {path?: string[]; value?: {_ref?: string}}
              return (
                Array.isArray(p?.path) &&
                p.path?.includes('asset') &&
                (p.value?._ref === 'browse-selected-asset-456' ||
                  (patch as {value?: {_ref?: string}})?.value?._ref !== undefined)
              )
            })
          })
          expect(hasBrowseAssetPatch).toBe(true)
        },
        {timeout: 10000},
      )
    }, 15000)

    it('renders multi-browse UI and can select from dropdown when multiple asset sources', async () => {
      const source1 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-a'})
      const source2 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-b'})

      const {onChange} = await renderFn({
        assetSources: [source1, source2],
        fieldDefinition,
        observeAsset: observeAsset as any,
        render: (inputProps) => <BaseInput {...(inputProps as any)} />,
      })

      const multiBrowseTestId = getMultiBrowseTestId(fieldDefinition.type)
      const browseSourceATestId = getBrowseTestId(fieldDefinition.type, 'source-a')

      expect(screen.getByTestId(multiBrowseTestId)).toBeInTheDocument()
      await userEvent.click(screen.getByTestId(multiBrowseTestId))
      const browseSourceA = await screen.findByTestId(browseSourceATestId)
      await userEvent.click(browseSourceA)

      await waitFor(
        () => {
          expect(
            onChange.mock.calls.some((call) => {
              const arg = call[0]
              const patches = Array.isArray(arg) ? arg : (arg as {patches?: unknown[]})?.patches
              if (!Array.isArray(patches)) return false
              return patches.some((patch: unknown) => {
                const p = patch as {path?: string[]; value?: {_ref?: string}}
                return p.path?.includes('asset') && p.value?._ref === 'browse-selected-asset-456'
              })
            }),
          ).toBe(true)
        },
        {timeout: 10000},
      )
    }, 15000)

    it('opens source directly (no file picker) when asset source uses component mode upload', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader({
        name: 'component-source',
        uploadMode: 'component',
      })

      const {onChange} = await renderFn({
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        render: (inputProps) => <BaseInput {...(inputProps as any)} />,
      })

      const uploadButton = screen.getByTestId('file-input-upload-button-component-source')
      expect(uploadButton).toBeInTheDocument()
      // eslint-disable-next-line testing-library/no-node-access -- hidden file input has no accessible role
      expect(uploadButton.querySelector('input[type="file"]')).not.toBeInTheDocument()
      await userEvent.click(uploadButton)

      await waitFor(
        () => {
          const hasAssetPatch = onChange.mock.calls.some((call) => {
            const arg = call[0]
            const patches = Array.isArray(arg) ? arg : (arg as {patches?: unknown[]})?.patches
            if (!Array.isArray(patches)) return false
            return patches.some((patch: unknown) => {
              const p = patch as {path?: string[]}
              return Array.isArray(p?.path) && p.path.some((seg) => seg === 'asset')
            })
          })
          expect(hasAssetPatch).toBe(true)
        },
        {timeout: 10000},
      )
    }, 15000)

    it('uses default dataset source when assetSources is empty (file and image only)', async () => {
      if (_inputType === 'video') return
      await renderFn({
        assetSources: [],
        fieldDefinition,
        observeAsset: observeAsset as any,
        render: (inputProps) => <BaseInput {...(inputProps as any)} />,
      })

      expect(screen.getByTestId('file-input-upload-button-sanity-default')).toBeInTheDocument()
      expect(
        screen.queryByTestId(getBrowseTestId(fieldDefinition.type, 'media-library-mock')),
      ).not.toBeInTheDocument()
    })

    it('renders the upload button as disabled when directUploads is false', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader()

      await renderFn({
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        render: (inputProps) => <BaseInput {...(inputProps as any)} directUploads={false} />,
      })

      expect(screen.getByTestId(uploadTestId).getAttribute('data-disabled')).toBe('true')
    })
  },
)

const BROWSE_AFTER_UPLOAD_CONFIGS = [
  {
    inputType: 'file',
    uploadTestId: 'file-input-upload-button-media-library-mock',
    render: renderFileInput,
    BaseInput: BaseFileInput,
    observeAsset: observeFileAssetStub,
    fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
    documentValue: {
      someFile: {
        _type: 'file',
        asset: {
          _type: 'reference',
          _ref: 'file-26db46ec62059d6cd491b4343afaecc92ff1b4d5-txt',
        },
      },
    },
    imageUrlBuilder: undefined,
  },
  {
    inputType: 'image',
    uploadTestId: 'file-input-upload-button',
    render: renderImageInput,
    BaseInput: BaseImageInput,
    observeAsset: observeImageAssetStub,
    fieldDefinition: {name: 'mainImage', title: 'Main image', type: 'image'},
    documentValue: {
      mainImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-26db46ec62059d6cd491b4343afaecc92ff1b4d5-100x100-jpg',
        },
      },
    },
    imageUrlBuilder: createImageUrlBuilder({projectId: 'test', dataset: 'test'}),
  },
  {
    inputType: 'video',
    uploadTestId: 'video-input-upload-button-media-library-mock',
    render: renderVideoInput,
    BaseInput: BaseVideoInput,
    observeAsset: observeVideoAssetStub,
    fieldDefinition: {name: 'someVideo', title: 'A video', type: 'sanity.video'},
    documentValue: {
      someVideo: {
        _type: 'sanity.video',
        asset: {
          _type: 'globalDocumentReference',
          _ref: 'media-library:ml123:video-test-asset-123',
        },
      },
    },
    imageUrlBuilder: undefined,
  },
] as const

const OPEN_IN_SOURCE_URL = 'https://example.com/open-in-source'

describe.each(BROWSE_AFTER_UPLOAD_CONFIGS)(
  'Asset source integration - browse after upload - $inputType',
  ({
    inputType: _inputType,
    uploadTestId,
    render: renderFn,
    BaseInput,
    observeAsset,
    fieldDefinition,
    documentValue,
    imageUrlBuilder,
  }) => {
    const getBrowseTestIdForConfig = () =>
      _inputType === 'image'
        ? getBrowseTestIdSingleSource(fieldDefinition.type)
        : getBrowseTestId(fieldDefinition.type, 'media-library-mock')
    it('can open asset in source when asset source supports openInSource', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      try {
        const assetSource = createMockAssetSourceWithMediaLibraryUploader({
          openInSourceUrl: OPEN_IN_SOURCE_URL,
        })

        const baseOptions = {
          assetSources: [assetSource],
          fieldDefinition,
          observeAsset: observeAsset as any,
          props: {documentValue},
          render: (inputProps: any) => <BaseInput {...(inputProps as any)} />,
        }
        const renderOptions =
          imageUrlBuilder !== undefined ? {...baseOptions, imageUrlBuilder} : baseOptions

        await renderFn(renderOptions as any)

        const optionsButton = await screen.findByTestId('options-menu-button', {}, {timeout: 5000})
        await userEvent.click(optionsButton)

        const openInSourceMenuItem = await screen.findByTestId(
          'file-input-open-in-source',
          {},
          {timeout: 5000},
        )
        await userEvent.click(openInSourceMenuItem)

        expect(openSpy).toHaveBeenCalledWith(OPEN_IN_SOURCE_URL, '_blank')
      } finally {
        openSpy.mockRestore()
      }
    }, 15000)

    it('can browse and select a new asset after upload when asset is selected', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader()

      const baseOptions = {
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        props: {documentValue},
        render: (inputProps: any) => <BaseInput {...(inputProps as any)} />,
      }
      const renderOptions =
        imageUrlBuilder !== undefined ? {...baseOptions, imageUrlBuilder} : baseOptions

      const {onChange} = await renderFn(renderOptions as any)

      const optionsButton = await screen.findByTestId('options-menu-button', {}, {timeout: 5000})
      await userEvent.click(optionsButton)
      const browseButton = await screen.findByTestId(
        getBrowseTestIdForConfig(),
        {},
        {timeout: 5000},
      )
      await userEvent.click(browseButton)

      await waitFor(
        () => {
          const hasBrowseAssetPatch = onChange.mock.calls.some((call) => {
            const arg = call[0]
            const patches = Array.isArray(arg) ? arg : (arg as {patches?: unknown[]})?.patches
            if (!Array.isArray(patches)) return false
            return patches.some((patch: unknown) => {
              const p = patch as {path?: string[]; value?: {_ref?: string}}
              return (
                Array.isArray(p?.path) &&
                p.path?.includes('asset') &&
                p.value?._ref === 'browse-selected-asset-456'
              )
            })
          })
          expect(hasBrowseAssetPatch).toBe(true)
        },
        {timeout: 10000},
      )
    }, 15000)

    it('opens asset source dialog with action openInSource when openInSource returns type component', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader({
        openInSourceResultType: 'component',
      })

      const baseOptions = {
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        props: {documentValue},
        render: (inputProps: any) => <BaseInput {...(inputProps as any)} />,
      }
      const renderOptions =
        imageUrlBuilder !== undefined ? {...baseOptions, imageUrlBuilder} : baseOptions

      await renderFn(renderOptions as any)

      const optionsButton = await screen.findByTestId('options-menu-button', {}, {timeout: 5000})
      await userEvent.click(optionsButton)
      const openInSourceMenuItem = await screen.findByTestId(
        'file-input-open-in-source',
        {},
        {timeout: 5000},
      )
      await userEvent.click(openInSourceMenuItem)

      await waitFor(
        () => {
          expect(screen.getByTestId('mock-upload-component')).toBeInTheDocument()
        },
        {timeout: 5000},
      )
      expect(screen.getByTestId('mock-upload-component')).toHaveTextContent('Open in Source')
    }, 15000)

    it('passes selectedAssets when opened via browse with existing value', async () => {
      const SelectedAssetsTestSource: AssetSource = {
        name: 'media-library-mock',
        title: 'Test',
        component: (props) => (
          <div
            data-testid="selected-assets-test"
            data-selected-assets-count={props.selectedAssets.length}
          />
        ),
        Uploader: MediaLibraryUploader,
      }

      const baseOptions = {
        assetSources: [SelectedAssetsTestSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        props: {documentValue},
        render: (inputProps: any) => <BaseInput {...(inputProps as any)} />,
      }
      const renderOptions =
        imageUrlBuilder !== undefined ? {...baseOptions, imageUrlBuilder} : baseOptions

      await renderFn(renderOptions as any)

      const optionsButton = await screen.findByTestId('options-menu-button', {}, {timeout: 5000})
      await userEvent.click(optionsButton)
      const browseButton = await screen.findByTestId(
        getBrowseTestIdForConfig(),
        {},
        {timeout: 5000},
      )
      await userEvent.click(browseButton)

      await waitFor(
        () => {
          const el = screen.getByTestId('selected-assets-test')
          expect(el).toHaveAttribute('data-selected-assets-count', '1')
        },
        {timeout: 5000},
      )
    }, 15000)

    it('disables browse and clear when readOnly', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader()

      const baseOptions = {
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        props: {documentValue},
        render: (inputProps: any) => <BaseInput {...(inputProps as any)} readOnly />,
      }
      const renderOptions =
        imageUrlBuilder !== undefined ? {...baseOptions, imageUrlBuilder} : baseOptions

      await renderFn(renderOptions as any)

      const optionsButton = await screen.findByTestId('options-menu-button', {}, {timeout: 5000})
      await userEvent.click(optionsButton)

      const browseButton = screen.getByTestId(getBrowseTestIdForConfig())
      const clearButton = screen.getByTestId('file-input-clear')
      expect(browseButton).toHaveAttribute('data-disabled')
      expect(clearButton).toHaveAttribute('data-disabled')
    }, 15000)

    it('renders the upload button as disabled when directUploads is false', async () => {
      const assetSource = createMockAssetSourceWithMediaLibraryUploader()

      const baseOptions = {
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        props: {documentValue},
        render: (inputProps: any) => <BaseInput {...(inputProps as any)} directUploads={false} />,
      }
      const renderOptions =
        imageUrlBuilder !== undefined ? {...baseOptions, imageUrlBuilder} : baseOptions

      await renderFn(renderOptions as any)

      const optionsButton = await screen.findByTestId('options-menu-button', {}, {timeout: 5000})
      await userEvent.click(optionsButton)

      const uploadButton = screen.getByTestId(uploadTestId)
      expect(uploadButton).toHaveAttribute('data-disabled')
    }, 15000)

    it('renders upload but no browse when schemaType.options.sources is empty', async () => {
      // Image input's asset menu does not check schemaType.options.sources - only File and Video do
      if (_inputType === 'image') return

      const assetSource = createMockAssetSourceWithMediaLibraryUploader()

      const baseOptions = {
        assetSources: [assetSource],
        fieldDefinition,
        observeAsset: observeAsset as any,
        props: {documentValue},
        render: (inputProps: any) => (
          <BaseInput
            {...(inputProps as any)}
            schemaType={
              {
                ...inputProps.schemaType,
                options: {...inputProps.schemaType?.options, sources: []},
              } as any
            }
          />
        ),
      }
      const renderOptions =
        imageUrlBuilder !== undefined ? {...baseOptions, imageUrlBuilder} : baseOptions

      await renderFn(renderOptions as any)

      const optionsButton = await screen.findByTestId('options-menu-button', {}, {timeout: 5000})
      await userEvent.click(optionsButton)

      expect(screen.getByTestId(uploadTestId)).toBeInTheDocument()
      expect(screen.queryByTestId(getBrowseTestIdForConfig())).not.toBeInTheDocument()
    }, 15000)
  },
)
