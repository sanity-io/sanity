/**
 * Tests for drag-and-drop and paste upload via uploadTarget/fileTarget.
 * Shared behavior used by FileInput, ImageInput, and VideoInput.
 */
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {
  createMockAssetSourceWithMediaLibraryUploader,
  observeFileAssetStub,
} from '../../../../../../../test/fixtures/assetSourceMocks'
import {renderFileInput} from '../../../../../../../test/form'
import {BaseFileInput} from '../../FileInput'

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
