/**
 * Integration tests for ImageInput and FileInput when using Asset Source plugins
 * with an Uploader (e.g. Media Library).
 *
 * Tests the flow: user selects file → asset source opens with uploader →
 * plugin "completes" (onSelect + signalCompletion) → input receives selection and resets state.
 */
import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceComponentProps,
  type FileAsset,
} from '@sanity/types'
import {screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {useEffect} from 'react'
import {of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {renderFileInput} from '../../../../../../test/form'
import {MediaLibraryUploader} from '../../../studio/assetSourceMediaLibrary/uploader'
import {BaseFileInput} from '../FileInput'

function createStubFileAsset(id: string): FileAsset {
  return {
    _id: id,
    _rev: 'rev',
    _type: 'sanity.fileAsset',
    originalFilename: 'stub.pdf',
    url: `https://example.com/${id}`,
    size: 100,
  } as FileAsset
}

const observeAssetStub = (assetId: string) => of(createStubFileAsset(assetId))

function createMockAssetSourceWithMediaLibraryUploader(): AssetSource {
  const MockUploadComponent = (props: AssetSourceComponentProps) => {
    const {onSelect, uploader, onClose} = props

    // When in upload mode with an uploader, simulate the plugin completing:
    // 1. Call onSelect with mock assets (like uploadResponse → handleUploaded)
    // 2. Call signalCompletion (like UploadAssetDialog does after handleUploaded)
    useEffect(() => {
      if (props.action === 'upload' && uploader) {
        const files = uploader.getFiles()
        if (files.length === 0) return
        const assetFromSource: AssetFromSource = {
          kind: 'assetDocumentId',
          value: 'test-file-asset-123',
        }
        onSelect([assetFromSource])
        onClose?.()
        if ('signalCompletion' in uploader && typeof uploader.signalCompletion === 'function') {
          uploader.signalCompletion()
        }
      }
    }, [props.action, uploader, onSelect, onClose])

    // When in select mode (browse), simulate selecting an existing asset
    useEffect(() => {
      if (props.action !== 'select') return
      const assetFromSource: AssetFromSource = {
        kind: 'assetDocumentId',
        value: 'browse-selected-asset-456',
      }
      onSelect([assetFromSource])
      onClose?.()
    }, [props.action, onSelect, onClose])

    return (
      <div data-testid="mock-upload-component">
        {props.action === 'upload' ? 'Uploading...' : 'Selecting...'}
      </div>
    )
  }

  return {
    name: 'media-library-mock',
    title: 'Media Library Mock',
    component: MockUploadComponent,
    Uploader: MediaLibraryUploader,
  }
}

describe('FileInput with Asset Source Uploader', () => {
  it('completes upload and receives selection when asset source signals completion', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    const {onChange} = await renderFileInput({
      assetSources: [assetSource],
      fieldDefinition: {
        name: 'someFile',
        title: 'A file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
    const uploadButton = screen.getByTestId('file-input-upload-button-media-library-mock')
    const fileInput = uploadButton.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()

    await userEvent.upload(fileInput as HTMLInputElement, file)

    // Mock asset source completes immediately (onSelect + signalCompletion). The flow:
    // 1. createInitialUploadPatches → onChange (upload state)
    // 2. Mock calls onSelect → handleSelectAssetFromSource → onChange (asset reference)
    // 3. signalCompletion → all-complete → reset. Without step 3 the input stays stuck in uploading state.
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
    const file2 = new File(['more content'], 'test2.pdf', {type: 'application/pdf'})
    await userEvent.upload(fileInput as HTMLInputElement, file2)
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

  it('can browse and select a new asset after upload (when a file is selected)', async () => {
    const assetSource = createMockAssetSourceWithMediaLibraryUploader()

    const {onChange} = await renderFileInput({
      assetSources: [assetSource],
      fieldDefinition: {
        name: 'someFile',
        title: 'A file',
        type: 'file',
      },
      observeAsset: observeAssetStub,
      props: {
        documentValue: {
          someFile: {
            _type: 'file',
            asset: {
              _type: 'reference',
              _ref: 'file-26db46ec62059d6cd491b4343afaecc92ff1b4d5-txt',
            },
          },
        },
      },
      render: (inputProps) => <BaseFileInput {...inputProps} />,
    })

    // Simulates post-upload: file is selected, user opens menu → browse → selects different asset
    const optionsButton = screen.getByTestId('options-menu-button')
    await userEvent.click(optionsButton)
    const browseButton = screen.getByTestId('file-input-browse-button-media-library-mock')
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
})
