import {takeDomPropWarnings} from '@repo/test-config/vitest/failOnReactDomPropWarnings'
import {type AssetSource} from '@sanity/types'
/**
 * Tests for drag-and-drop and paste upload via uploadTarget/fileTarget.
 * Shared behavior used by FileInput, ImageInput, and VideoInput.
 */
import {act, fireEvent, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode, useSyncExternalStore} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {
  createMockAssetSourceWithMediaLibraryUploader,
  observeFileAssetStub,
  observeImageAssetStub,
  observeVideoAssetStub,
} from '../../../../../../../test/fixtures/assetSourceMocks'
import {renderArrayOfObjectsInput} from '../../../../../../../test/form/renderArrayOfObjectsInput'
import {renderFileInput} from '../../../../../../../test/form/renderFileInput'
import {renderImageInput} from '../../../../../../../test/form/renderImageInput'
import {renderVideoInput} from '../../../../../../../test/form/renderVideoInput'
import {BaseVideoInput} from '../../../../../../media-library/plugin/VideoInput/VideoInput'
import {type ArrayOfObjectsInputProps} from '../../../../types/inputProps'
import {ListArrayInput} from '../../../arrays/ArrayOfObjectsInput/List/ListArrayInput'
import {BaseFileInput} from '../../FileInput/FileInput'
import {BaseImageInput} from '../../ImageInput/ImageInput'
import type * as ExtractFilesModule from '../fileTarget/utils/extractFiles'

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
    retry: () => {},
  }),
}))
vi.mock('../../../../../../media-library/plugin/VideoInput/VideoPlayer', () => ({
  default: () => null,
}))

// Lets a test hold the asynchronous file extraction of a drop (a directory drop walks its tree)
// until it has changed the input, the way a real extraction can outlive a read-only transition.
const deferredExtraction = vi.hoisted(() => ({pending: null as Promise<File[]> | null}))
vi.mock('../fileTarget/utils/extractFiles', async (importOriginal) => {
  const actual = await importOriginal<typeof ExtractFilesModule>()
  return {
    ...actual,
    extractDroppedFiles: (dataTransfer: DataTransfer) =>
      deferredExtraction.pending ?? actual.extractDroppedFiles(dataTransfer),
  }
})

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
      add: () => {},
      clear: () => {},
      get: () => null,
      remove: () => {},
      *[Symbol.iterator]() {
        for (const f of files) {
          yield {
            kind: 'file' as const,
            type: f.type,
            getAsFile: () => f,
            getAsString: () => {},
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

  it('hides drop overlay when Escape is pressed after dragenter', async () => {
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

    fireEvent.dragEnter(fileTarget!, {
      dataTransfer: {
        items: [{kind: 'file' as const, type: 'application/pdf'}],
        files: [] as File[],
      },
    })

    await waitFor(() => {
      expect(screen.getByTestId('upload-target-drop-message')).toBeInTheDocument()
    })

    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('upload-target-drop-message')).not.toBeInTheDocument()
    })
  })

  it('does not let the first Escape past the drop overlay', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()
    const globalEscape = vi.fn()
    window.addEventListener('keydown', globalEscape)

    try {
      await renderFileInput({
        assetSources: [assetSource],
        configOverrides: {mediaLibrary: {enabled: false}},
        fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
        observeAsset: observeFileAssetStub,
        render: (inputProps) => <BaseFileInput {...inputProps} />,
      })

      const fileTarget = document.querySelector('[data-test-id="file-target"]')
      expect(fileTarget).toBeInTheDocument()

      fireEvent.dragEnter(fileTarget!, {
        dataTransfer: {
          items: [{kind: 'file' as const, type: 'application/pdf'}],
          files: [] as File[],
        },
      })

      await waitFor(() => {
        expect(screen.getByTestId('upload-target-drop-message')).toBeInTheDocument()
      })

      await userEvent.keyboard('{Escape}')

      await waitFor(() =>
        expect(screen.queryByTestId('upload-target-drop-message')).not.toBeInTheDocument(),
      )
      expect(globalEscape).not.toHaveBeenCalled()

      await userEvent.keyboard('{Escape}')
      expect(globalEscape).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener('keydown', globalEscape)
    }
  })

  it('still tracks a later drag after Escape cancelled the previous one', async () => {
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

    const dataTransfer = {
      items: [{kind: 'file' as const, type: 'application/pdf'}],
      files: [] as File[],
    }

    fireEvent.dragEnter(fileTarget!, {dataTransfer})
    await waitFor(() => {
      expect(screen.getByTestId('upload-target-drop-message')).toBeInTheDocument()
    })

    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByTestId('upload-target-drop-message')).not.toBeInTheDocument()
    })

    fireEvent.dragEnter(fileTarget!, {dataTransfer})
    await waitFor(() => {
      expect(screen.getByTestId('upload-target-drop-message')).toBeInTheDocument()
    })

    fireEvent.dragLeave(fileTarget!, {dataTransfer})
    await waitFor(() => {
      expect(screen.queryByTestId('upload-target-drop-message')).not.toBeInTheDocument()
    })
  })

  it('hides drop overlay when the window dragend event fires', async () => {
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

    fireEvent.dragEnter(fileTarget!, {
      dataTransfer: {
        items: [{kind: 'file' as const, type: 'application/pdf'}],
        files: [] as File[],
      },
    })

    await waitFor(() => {
      expect(screen.getByTestId('upload-target-drop-message')).toBeInTheDocument()
    })

    fireEvent(window, new Event('dragend'))

    await waitFor(() => {
      expect(screen.queryByTestId('upload-target-drop-message')).not.toBeInTheDocument()
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
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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

  it('does not swallow Escape when readOnly and no overlay is rendered', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()
    const globalEscape = vi.fn()
    window.addEventListener('keydown', globalEscape)

    try {
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

      await userEvent.keyboard('{Escape}')

      expect(globalEscape).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener('keydown', globalEscape)
    }
  })

  it('does not register window dragend/keydown listeners when onFilesOver is absent (readOnly)', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    try {
      await renderFileInput({
        assetSources: [assetSource],
        configOverrides: {mediaLibrary: {enabled: false}},
        fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
        observeAsset: observeFileAssetStub,
        render: (inputProps) => <BaseFileInput {...inputProps} readOnly />,
      })

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('dragend', expect.anything())
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.anything(), true)
    } finally {
      addEventListenerSpy.mockRestore()
    }
  })
})

describe('uploadTarget - card props', () => {
  it('keeps onUpload off the card element', async () => {
    await renderArrayOfObjectsInput({
      fieldDefinition: {
        name: 'items',
        type: 'array',
        of: [{type: 'object', name: 'item', fields: [{name: 'title', type: 'string'}]}],
      },
      render: (inputProps) => <ListArrayInput {...inputProps} onUpload={vi.fn()} />,
    })

    expect(document.querySelector('[data-test-id="file-target"]')).toBeInTheDocument()
    expect(takeDomPropWarnings()).toEqual([])
  })
})

// A read-only flag the test flips from outside React, the way a form does when a document pair
// replayed from cache (`ready: false`) receives its fresh snapshot and becomes editable.
function createReadOnlyStore(initial: boolean) {
  let readOnly = initial
  const listeners = new Set<() => void>()
  return {
    get: () => readOnly,
    set: (next: boolean) => {
      readOnly = next
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

function WithReadOnly(props: {
  children: (readOnly: boolean) => ReactNode
  store: ReturnType<typeof createReadOnlyStore>
}) {
  const {children, store} = props
  const readOnly = useSyncExternalStore(store.subscribe, store.get)
  return children(readOnly)
}

function fileTargetTone(): string | null | undefined {
  return document.querySelector('[data-test-id="file-target"]')?.getAttribute('data-tone')
}

describe('uploadTarget - tone and read-only transitions', () => {
  it('follows the read-only state of the input after mount', async () => {
    const readOnly = createReadOnlyStore(true)

    await renderArrayOfObjectsInput({
      fieldDefinition: {
        name: 'items',
        type: 'array',
        of: [{type: 'object', name: 'item', fields: [{name: 'title', type: 'string'}]}],
      },
      render: (inputProps) => (
        <WithReadOnly store={readOnly}>
          {(isReadOnly) => <ListArrayInput {...inputProps} readOnly={isReadOnly} />}
        </WithReadOnly>
      ),
    })

    expect(fileTargetTone()).toBe('transparent')

    await act(async () => {
      readOnly.set(false)
    })
    expect(fileTargetTone()).toBe('default')

    await act(async () => {
      readOnly.set(true)
    })
    expect(fileTargetTone()).toBe('transparent')
  })

  it('uses the hover tone while files are dragged over the target and the base tone afterwards', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    await renderFileInput({
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
    expect(fileTargetTone()).toBe('default')

    const accepted = {
      items: [{kind: 'file' as const, type: 'application/pdf'}],
      files: [] as File[],
    }
    fireEvent.dragEnter(fileTarget!, {dataTransfer: accepted})
    await waitFor(() => expect(fileTargetTone()).toBe('primary'))

    fireEvent.dragLeave(fileTarget!, {dataTransfer: accepted})
    await waitFor(() => expect(fileTargetTone()).toBe('default'))

    const rejected = {items: [{kind: 'file' as const, type: 'text/plain'}], files: [] as File[]}
    fireEvent.dragEnter(fileTarget!, {dataTransfer: rejected})
    await waitFor(() => expect(fileTargetTone()).toBe('critical'))

    fireEvent.dragLeave(fileTarget!, {dataTransfer: rejected})
    await waitFor(() => expect(fileTargetTone()).toBe('default'))
  })

  it('drops the hover state when the input turns read-only during a drag', async () => {
    const readOnly = createReadOnlyStore(false)
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    await renderFileInput({
      assetSources: [assetSource],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
      observeAsset: observeFileAssetStub,
      render: (inputProps) => (
        <WithReadOnly store={readOnly}>
          {(isReadOnly) => <BaseFileInput {...inputProps} readOnly={isReadOnly} />}
        </WithReadOnly>
      ),
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    fireEvent.dragEnter(fileTarget!, {
      dataTransfer: {
        items: [{kind: 'file' as const, type: 'application/pdf'}],
        files: [] as File[],
      },
    })
    await waitFor(() => expect(fileTargetTone()).toBe('primary'))
    expect(screen.getByTestId('upload-target-drop-message')).toBeInTheDocument()

    await act(async () => {
      readOnly.set(true)
    })
    expect(fileTargetTone()).toBe('transparent')
    expect(screen.queryByTestId('upload-target-drop-message')).not.toBeInTheDocument()

    // The drag ended while read-only, so nothing hover-related comes back with editability
    await act(async () => {
      readOnly.set(false)
    })
    expect(fileTargetTone()).toBe('default')
    expect(screen.queryByTestId('upload-target-drop-message')).not.toBeInTheDocument()
  })

  it('does not swallow Escape for a drag that ended while the input was read-only', async () => {
    const readOnly = createReadOnlyStore(false)
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()
    const globalEscape = vi.fn()
    window.addEventListener('keydown', globalEscape)

    try {
      await renderFileInput({
        assetSources: [assetSource],
        configOverrides: {mediaLibrary: {enabled: false}},
        fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
        observeAsset: observeFileAssetStub,
        render: (inputProps) => (
          <WithReadOnly store={readOnly}>
            {(isReadOnly) => <BaseFileInput {...inputProps} readOnly={isReadOnly} />}
          </WithReadOnly>
        ),
      })

      const fileTarget = document.querySelector('[data-test-id="file-target"]')
      expect(fileTarget).toBeInTheDocument()

      fireEvent.dragEnter(fileTarget!, {
        dataTransfer: {
          items: [{kind: 'file' as const, type: 'application/pdf'}],
          files: [] as File[],
        },
      })
      await waitFor(() => {
        expect(screen.getByTestId('upload-target-drop-message')).toBeInTheDocument()
      })

      // Read-only while the drag ends outside the window, then editable again
      await act(async () => {
        readOnly.set(true)
      })
      await act(async () => {
        readOnly.set(false)
      })

      await userEvent.keyboard('{Escape}')
      expect(globalEscape).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener('keydown', globalEscape)
    }
  })

  it('closes the destination picker and drops the queued files when the input turns read-only', async () => {
    const readOnly = createReadOnlyStore(false)
    const source1 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-a'})
    const source2 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-b'})

    const {onChange} = await renderFileInput({
      assetSources: [source1, source2],
      configOverrides: {mediaLibrary: {enabled: false}},
      fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
      observeAsset: observeFileAssetStub,
      render: (inputProps) => (
        <WithReadOnly store={readOnly}>
          {(isReadOnly) => <BaseFileInput {...inputProps} readOnly={isReadOnly} />}
        </WithReadOnly>
      ),
    })

    const fileTarget = document.querySelector('[data-test-id="file-target"]')
    expect(fileTarget).toBeInTheDocument()

    const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
    fireEvent.drop(fileTarget!, {dataTransfer: createMockDataTransfer([file])})
    await waitFor(() => {
      expect(screen.getByTestId('upload-destination-source-a')).toBeInTheDocument()
    })

    await act(async () => {
      readOnly.set(true)
    })
    expect(screen.queryByTestId('upload-destination-source-a')).not.toBeInTheDocument()

    // Nothing queued survives into the editable state either
    await act(async () => {
      readOnly.set(false)
    })
    expect(screen.queryByTestId('upload-destination-source-a')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores a drop whose file extraction finishes after the input turned read-only', async () => {
    const readOnly = createReadOnlyStore(false)
    const source1 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-a'})
    const source2 = createMockAssetSourceWithMediaLibraryUploader({name: 'source-b'})
    let finishExtraction!: (files: File[]) => void
    deferredExtraction.pending = new Promise<File[]>((resolve) => {
      finishExtraction = resolve
    })

    try {
      const {onChange} = await renderFileInput({
        assetSources: [source1, source2],
        configOverrides: {mediaLibrary: {enabled: false}},
        fieldDefinition: {name: 'someFile', title: 'A file', type: 'file'},
        observeAsset: observeFileAssetStub,
        render: (inputProps) => (
          <WithReadOnly store={readOnly}>
            {(isReadOnly) => <BaseFileInput {...inputProps} readOnly={isReadOnly} />}
          </WithReadOnly>
        ),
      })

      const fileTarget = document.querySelector('[data-test-id="file-target"]')
      expect(fileTarget).toBeInTheDocument()

      const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
      fireEvent.drop(fileTarget!, {dataTransfer: createMockDataTransfer([file])})

      // The input turns read-only while the extraction is still running
      await act(async () => {
        readOnly.set(true)
      })
      await act(async () => {
        finishExtraction([file])
      })

      // With two sources an accepted drop would have opened the destination picker
      expect(screen.queryByTestId('upload-destination-source-a')).not.toBeInTheDocument()
      expect(onChange).not.toHaveBeenCalled()
    } finally {
      deferredExtraction.pending = null
    }
  })
})
