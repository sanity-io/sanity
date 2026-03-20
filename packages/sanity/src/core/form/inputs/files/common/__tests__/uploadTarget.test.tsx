import {type AssetSource} from '@sanity/types'
/**
 * Tests for drag-and-drop and paste upload via uploadTarget/fileTarget.
 * Shared behavior used by FileInput, ImageInput, and VideoInput.
 */
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {
  createMockAssetSourceWithMediaLibraryUploader,
  observeFileAssetStub,
  observeImageAssetStub,
  observeVideoAssetStub,
} from '../../../../../../../test/fixtures/assetSourceMocks'
import {renderFileInput, renderImageInput, renderVideoInput} from '../../../../../../../test/form'
import {BaseVideoInput} from '../../../../../../media-library/plugin/VideoInput/VideoInput'
import {BaseFileInput} from '../../FileInput'
import {BaseImageInput} from '../../ImageInput'

// Mock useVideoPlaybackInfo and VideoPlayer for video tests (VideoInput uses these)
vi.mock('../../../../../../media-library/plugin/VideoInput/useVideoPlaybackInfo', () => ({
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
vi.mock('../../../../../../media-library/plugin/VideoInput/VideoPlayer', () => ({
  VideoPlayer: () => null,
}))

/**
 * Creates a DataTransfer-like object for drag/drop tests.
 * JSDOM may not have DataTransfer; extractDroppedFiles uses dataTransfer.files first.
 */
function createMockDataTransfer(files: File[]): DataTransfer {
  if (typeof DataTransfer !== 'undefined') {
    const dt = new DataTransfer()
    files.forEach((f) => dt.items.add(f))
    return dt
  }
  // Fallback for environments without DataTransfer
  const fileList = Object.assign([...files], {
    item: (i: number) => files[i] ?? null,
    length: files.length,
  }) as FileList
  return {
    files: fileList,
    items: {
      length: files.length,
      add: () => {
        /* intentionally empty */
      },
      clear: () => {
        /* intentionally empty */
      },
      get: () => null,
      remove: () => {
        /* intentionally empty */
      },
      *[Symbol.iterator]() {
        for (const f of files) {
          yield {
            kind: 'file' as const,
            type: f.type,
            getAsFile: () => f,
            getAsString: () => {
              /* intentionally empty */
            },
            webkitGetAsEntry: () => null,
          } as DataTransferItem
        }
      },
    } as unknown as DataTransferItemList,
  } as unknown as DataTransfer
}

describe('uploadTarget - drag and drop', () => {
  it('triggers upload when file is dropped onto the file target', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    const {onChange} = await renderFileInput({
      assetSources: [assetSource],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
      observeAsset: observeFileAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
    const dataTransfer = createMockDataTransfer([file])

    fireEvent.drop(fileTarget!, {dataTransfer})

    await waitFor(
      () => {
        const calls = onChange.mock.calls
        expect(calls.length).toBeGreaterThanOrEqual(1)
        const hasAssetPatch = calls.some((call) => {
          const arg = call[0]
          const patches = Array.isArray(arg) ? arg : (arg as {patches?: unknown[]})?.patches
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
  }, 15000)

  it('shows drop-to-upload message when dragging files over the target', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    await renderFileInput({
      assetSources: [assetSource],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
      observeAsset: observeFileAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const fileTypes = [{kind: 'file' as const, type: 'application/pdf'}]
    const dataTransfer = {
      items: fileTypes,
      files: [] as File[],
    }

    fireEvent.dragEnter(fileTarget!, {dataTransfer})

    await waitFor(() => {
      expect(screen.getByTestId('upload-target-drop-message')).toBeInTheDocument()
    })
  })

  it('shows upload destination picker when multiple asset sources and user selects one', async () => {
    const source1 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-a'})
    const source2 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-b'})

    const {onChange} = await renderFileInput({
      assetSources: [source1, source2],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
      observeAsset: observeFileAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
    const dataTransfer = createMockDataTransfer([file])

    fireEvent.drop(fileTarget!, {dataTransfer})

    await waitFor(() => {
      expect(screen.getByTestId('upload-destination-source-a')).toBeInTheDocument()
      expect(screen.getByTestId('upload-destination-source-b')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByTestId('upload-destination-source-a'))

    await waitFor(
      () => {
        const calls = onChange.mock.calls
        expect(calls.length).toBeGreaterThanOrEqual(1)
        const hasAssetPatch = calls.some((call) => {
          const arg = call[0]
          const patches = Array.isArray(arg) ? arg : (arg as {patches?: unknown[]})?.patches
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
  }, 15000)

  it('denies files that do not match schema options.accept', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    const {onChange} = await renderFileInput({
      assetSources: [assetSource],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {
        name: 'someFile',
        title: 'PDF only',
        type: 'file',
        options: {accept: 'application/pdf'},
      },
      observeAsset: observeFileAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const rejectedFile = new File(['content'], 'rejected.txt', {type: 'text/plain'})

    // Dragging a rejected file over shows "not allowed" message in overlay
    const dragDataTransfer = {
      items: [{kind: 'file' as const, type: 'text/plain'}],
      files: [] as File[],
    }
    fireEvent.dragEnter(fileTarget!, {dataTransfer: dragDataTransfer})

    await waitFor(() => {
      expect(screen.getByTestId('upload-target-drop-message-not-allowed')).toBeInTheDocument()
    })

    // Dropping does not trigger upload
    const dropDataTransfer = createMockDataTransfer([rejectedFile])
    fireEvent.drop(fileTarget!, {dataTransfer: dropDataTransfer})

    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  it('denies video files that do not match schema options.accept (e.g. video/webm when accept is video/mp4)', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    const {onChange} = await renderVideoInput({
      assetSources: [assetSource],
      fieldDefinition: {
        name: 'someVideo',
        title: 'MP4 only',
        type: 'sanity.video',
        options: {accept: 'video/mp4'},
      },
      observeAsset: observeVideoAssetStub,
      render: (inputProps) => <BaseVideoInput {...inputProps} />,
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const rejectedFile = new File(['content'], 'rejected.webm', {type: 'video/webm'})

    // Dragging a rejected video (webm) over shows "not allowed" message in overlay
    const dragDataTransfer = {
      items: [{kind: 'file' as const, type: 'video/webm'}],
      files: [] as File[],
    }
    fireEvent.dragEnter(fileTarget!, {dataTransfer: dragDataTransfer})

    await waitFor(() => {
      expect(screen.getByTestId('upload-target-drop-message-not-allowed')).toBeInTheDocument()
    })

    // Dropping does not trigger upload
    const dropDataTransfer = createMockDataTransfer([rejectedFile])
    fireEvent.drop(fileTarget!, {dataTransfer: dropDataTransfer})

    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  it('does not show browse-only asset sources in upload destination picker', async () => {
    // Browse-only source (no Uploader, no uploadMode: 'component') should not appear in picker
    const browseOnlySource: AssetSource = {
      name: 'browse-only',
      title: 'Browse Only',
      component: () => null,
    }
    const source1 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-a'})
    const source2 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-b'})

    await renderFileInput({
      assetSources: [browseOnlySource, source1, source2],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
      observeAsset: observeFileAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
    const dataTransfer = createMockDataTransfer([file])

    fireEvent.drop(fileTarget!, {dataTransfer})

    // Picker should show only upload-capable sources, not browse-only
    await waitFor(() => {
      expect(screen.getByTestId('upload-destination-source-a')).toBeInTheDocument()
      expect(screen.getByTestId('upload-destination-source-b')).toBeInTheDocument()
      expect(screen.queryByTestId('upload-destination-browse-only')).not.toBeInTheDocument()
    })
  })

  it('does not show browse-only asset sources in upload destination picker (image)', async () => {
    const browseOnlySource: AssetSource = {
      name: 'browse-only',
      title: 'Browse Only',
      component: () => null,
    }
    const source1 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-a'})
    const source2 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-b'})

    await renderImageInput({
      assetSources: [browseOnlySource, source1, source2],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'mainImage', title: 'Main image', type: 'image'},
      observeAsset: observeImageAssetStub,
      render: (inputProps) => <BaseImageInput {...inputProps} />,
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const file = new File(['content'], 'test.jpg', {type: 'image/jpeg'})
    const dataTransfer = createMockDataTransfer([file])

    fireEvent.drop(fileTarget!, {dataTransfer})

    await waitFor(() => {
      expect(screen.getByTestId('upload-destination-source-a')).toBeInTheDocument()
      expect(screen.getByTestId('upload-destination-source-b')).toBeInTheDocument()
      expect(screen.queryByTestId('upload-destination-browse-only')).not.toBeInTheDocument()
    })
  })

  it('does not show drop overlay when readOnly', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    await renderFileInput({
      assetSources: [assetSource],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
      observeAsset: observeFileAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} readOnly />,
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const fileTypes = [{kind: 'file' as const, type: 'application/pdf'}]
    const dataTransfer = {
      items: fileTypes,
      files: [] as File[],
    }

    fireEvent.dragEnter(fileTarget!, {dataTransfer})

    await waitFor(() => {
      expect(screen.queryByTestId('upload-target-drop-message')).not.toBeInTheDocument()
    })
  })
})
