/**
 * Shared test fixtures for asset source integration tests.
 * Used by FileInput, ImageInput, and VideoInput tests to avoid duplication.
 */
import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceComponentProps,
  type FileAsset,
  type ImageAsset,
} from '@sanity/types'
import {useEffect} from 'react'
import {type Observable, of} from 'rxjs'

import {MediaLibraryUploader} from '../../src/core/form/studio/assetSourceMediaLibrary/uploader'
import {type VideoAsset} from '../../src/media-library/plugin/schemas/types'

export interface MockAssetSourceOptions {
  /** Custom source name for data-testid attributes */
  name?: string
  /** Custom title for display */
  title?: string
  /** Asset ID returned on upload (default: 'test-file-asset-123') */
  uploadAssetId?: string
  /** Asset ID returned on browse/select (default: 'browse-selected-asset-456') */
  browseAssetId?: string
  /** URL returned by openInSource when type is 'url' (default: 'https://example.com/open-in-source') */
  openInSourceUrl?: string
  /** Return type for openInSource: 'url' | 'component' (default: 'url') */
  openInSourceResultType?: 'url' | 'component'
  /** Use component mode for uploads (opens source directly, no file picker) */
  uploadMode?: 'picker' | 'component'
}

/** Source object added to stub assets so findOpenInSourceResult can match them with the mock */
const STUB_SOURCE = {name: 'media-library-mock', id: 'stub-source-id'}

export function createStubFileAsset(id: string): FileAsset {
  return {
    _id: id,
    _rev: 'rev',
    _type: 'sanity.fileAsset',
    originalFilename: 'stub.pdf',
    url: `https://example.com/${id}`,
    size: 100,
    source: STUB_SOURCE,
  } as FileAsset
}

export function createStubImageAsset(id: string): ImageAsset {
  return {
    _id: id,
    _rev: 'rev',
    _type: 'sanity.imageAsset',
    assetId: id,
    extension: 'jpg',
    metadata: {
      _type: 'sanity.imageMetadata',
      dimensions: {_type: 'sanity.imageDimensions', aspectRatio: 1, height: 100, width: 100},
    },
    mimeType: 'image/jpeg',
    originalFilename: 'stub.jpg',
    url: `https://example.com/${id}`,
    size: 1000,
    source: STUB_SOURCE,
  } as ImageAsset
}

export function createStubVideoAsset(id: string): VideoAsset {
  return {
    _id: id,
    _rev: 'rev',
    _type: 'sanity.videoAsset',
    metadata: {_type: 'sanity.videoMetadata'},
    originalFilename: 'stub.mp4',
    url: `https://example.com/${id}`,
    size: 5000,
    source: STUB_SOURCE,
  } as VideoAsset
}

export function observeFileAssetStub(id: string): Observable<FileAsset> {
  return of(createStubFileAsset(id))
}

export function observeImageAssetStub(id: string): Observable<ImageAsset> {
  return of(createStubImageAsset(id))
}

export function observeVideoAssetStub(id: string): Observable<VideoAsset> {
  return of(createStubVideoAsset(id))
}

/**
 * Creates a mock asset source that auto-completes on both upload and browse actions.
 * Uses MediaLibraryUploader for upload mode (which has signalCompletion).
 * Reusable across File, Image, and Video input tests.
 */
export function createMockAssetSourceWithMediaLibraryUploader(
  options: MockAssetSourceOptions = {},
): AssetSource {
  const {
    name = 'media-library-mock',
    title = 'Media Library Mock',
    uploadAssetId = 'test-file-asset-123',
    browseAssetId = 'browse-selected-asset-456',
    openInSourceUrl = 'https://example.com/open-in-source',
    openInSourceResultType = 'url',
    uploadMode = 'picker',
  } = options

  const MockUploadComponent = (props: AssetSourceComponentProps) => {
    const {onSelect, uploader, onClose} = props

    // When in upload mode: with uploader (picker) simulate plugin completing after files; without (component) auto-select
    useEffect(() => {
      if (props.action !== 'upload') return
      if (uploader) {
        const files = uploader.getFiles()
        if (files.length === 0) return
        const assetFromSource: AssetFromSource = {
          kind: 'assetDocumentId',
          value: uploadAssetId,
        }
        onSelect([assetFromSource])
        onClose?.()
        if ('signalCompletion' in uploader && typeof uploader.signalCompletion === 'function') {
          uploader.signalCompletion()
        }
      } else {
        // Component mode: no file picker, source handles selection internally - auto-select
        const assetFromSource: AssetFromSource = {
          kind: 'assetDocumentId',
          value: uploadAssetId,
        }
        onSelect([assetFromSource])
        onClose?.()
      }
    }, [props.action, uploader, onSelect, onClose])

    // When in select mode (browse), simulate selecting an existing asset
    useEffect(() => {
      if (props.action !== 'select') return
      const assetFromSource: AssetFromSource = {
        kind: 'assetDocumentId',
        value: browseAssetId,
      }
      onSelect([assetFromSource])
      onClose?.()
    }, [props.action, onSelect, onClose])

    return (
      <div data-testid="mock-upload-component">
        {props.action === 'upload'
          ? 'Uploading...'
          : props.action === 'openInSource'
            ? 'Open in Source'
            : 'Selecting...'}
      </div>
    )
  }

  return {
    name,
    title,
    component: MockUploadComponent,
    Uploader: uploadMode === 'picker' ? MediaLibraryUploader : undefined,
    uploadMode: uploadMode === 'component' ? ('component' as const) : undefined,
    openInSource: (asset) => {
      if (asset?.source?.name !== name) return undefined
      if (openInSourceResultType === 'component') return {type: 'component' as const}
      return {type: 'url' as const, url: openInSourceUrl}
    },
  }
}
