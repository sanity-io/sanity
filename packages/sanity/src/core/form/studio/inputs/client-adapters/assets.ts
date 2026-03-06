import {type ProgressEvent, type SanityAssetDocument, type SanityClient} from '@sanity/client'
import {type FileAsset, type ImageAsset} from '@sanity/types'
import {from, Observable, of as observableOf} from 'rxjs'
import {catchError, map, mergeMap, startWith} from 'rxjs/operators'

import {type VideoAsset} from '../../../../../media-library/plugin/schemas/types'
import {type DocumentPreviewStore} from '../../../../preview'
import {sourceName as MEDIA_LIBRARY_SOURCE_NAME} from '../../assetSourceMediaLibrary'
import {DEFAULT_API_VERSION} from '../../assetSourceMediaLibrary/constants'
import {type UploadOptions} from '../../uploads/types'
import {withMaxConcurrency} from '../../utils'

const MAX_CONCURRENT_UPLOADS = 4

type UploadEvent = ProgressEvent | {type: 'complete'; id: string; asset: SanityAssetDocument}

function uploadSanityAsset(
  client: SanityClient,
  assetType: 'file' | 'image',
  file: File | Blob,
  options: UploadOptions = {},
): Observable<UploadEvent> {
  const extract = options.metadata
  const preserveFilename = options.storeOriginalFilename
  const {label, title, description, creditLine, source} = options
  return hashFile(file).pipe(
    catchError(() =>
      // ignore if hashing fails for some reason
      observableOf(null),
    ),

    mergeMap((hash) =>
      // note: the sanity api will still dedupe unique files, but this saves us from uploading the asset file entirely
      hash ? fetchExisting(client, `sanity.${assetType}Asset`, hash) : observableOf(null),
    ),

    mergeMap((existing: SanityAssetDocument | null) => {
      if (existing) {
        return observableOf({
          // complete with the existing asset document
          type: 'complete' as const,
          id: existing._id,
          asset: existing,
        })
      }
      return client.observable.assets
        .upload(assetType, file, {
          tag: 'asset.upload',
          extract,
          preserveFilename,
          label,
          title,
          description,
          creditLine,
          source,
        })
        .pipe(
          map((event) =>
            event.type === 'response'
              ? {
                  // rewrite to a 'complete' event
                  type: 'complete' as const,
                  id: event.body.document._id,
                  asset: event.body.document,
                }
              : event,
          ),
        )
    }),
  )
}

const uploadAsset = withMaxConcurrency(uploadSanityAsset, MAX_CONCURRENT_UPLOADS)

export const uploadImageAsset = (
  client: SanityClient,
  file: File | Blob,
  options?: UploadOptions,
) => uploadAsset(client, 'image', file, options)

export const uploadFileAsset = (client: SanityClient, file: File | Blob, options?: UploadOptions) =>
  uploadAsset(client, 'file', file, options)

/**
 * Parses a Media Library GDR ref.
 * Ref format: "media-library:ml[id]:[assetInstanceId]"
 * Returns null if the ref is not a media-library ref.
 */
function parseMediaLibraryRef(
  ref: string,
): {mediaLibraryId: string; assetInstanceId: string} | null {
  if (!ref.startsWith('media-library:')) {
    return null
  }
  const parts = ref.split(':')
  if (parts.length !== 3 || parts[1] === '' || parts[2] === '') {
    return null
  }
  return {mediaLibraryId: parts[1], assetInstanceId: parts[2]}
}

/**
 * Minimal synthetic Asset when we can't fetch from Media Library.
 * Used as fallback when client is unavailable or fetch fails.
 */
function mediaLibraryRefToMinimalAsset(ref: string, assetInstanceId: string): VideoAsset {
  return {
    _id: ref,
    _type: 'sanity.videoAsset',
    _rev: '',
    _createdAt: '',
    _updatedAt: '',
    url: '',
    path: '',
    assetId: ref,
    extension: '',
    mimeType: 'video/*',
    sha1hash: '',
    size: 0,
    metadata: {_type: 'sanity.videoMetadata'},
    source: {
      id: assetInstanceId,
      name: MEDIA_LIBRARY_SOURCE_NAME,
    },
  }
}

/** Media Library video doc shape from the API (matches SanityVideoAsset) */
interface MediaLibraryVideoDoc {
  _id?: string
  _type?: string
  _rev?: string
  _createdAt?: string
  _updatedAt?: string
  url?: string
  path?: string
  extension?: string
  mimeType?: string
  sha1hash?: string
  size?: number
  originalFilename?: string
  title?: string
  description?: unknown
  source?: {id?: string; name?: string; url?: string}
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Maps a Media Library video document to our Asset shape.
 * Pulls overlapping fields (url, path, mimeType, size, etc.) from the real doc.
 */
function mapMediaLibraryDocToAsset(
  doc: MediaLibraryVideoDoc | null,
  ref: string,
  assetInstanceId: string,
): VideoAsset {
  const base = mediaLibraryRefToMinimalAsset(ref, assetInstanceId)
  if (!doc) return base

  return {
    ...base,
    _id: doc._id ?? ref,
    _rev: doc._rev ?? base._rev,
    _createdAt: doc._createdAt ?? base._createdAt,
    _updatedAt: doc._updatedAt ?? base._updatedAt,
    url: doc.url ?? base.url,
    path: doc.path ?? base.path,
    assetId: doc._id ?? ref,
    extension: doc.extension ?? base.extension,
    mimeType: doc.mimeType ?? base.mimeType,
    sha1hash: doc.sha1hash ?? base.sha1hash,
    size: doc.size ?? base.size,
    originalFilename: doc.originalFilename,
    title: doc.title,
    ...(typeof doc.description === 'string' && {description: doc.description}),
    metadata:
      doc.metadata && typeof doc.metadata === 'object'
        ? {_type: 'sanity.videoMetadata', ...doc.metadata}
        : base.metadata,
    source: doc.source
      ? {
          id: doc.source.id ?? assetInstanceId,
          name: MEDIA_LIBRARY_SOURCE_NAME,
          url: doc.source.url,
        }
      : base.source,
  }
}

// Note: there's currently 100% overlap between the ImageAsset document and the FileAsset documents
// as per interface required by the image and file input
function observeAssetDoc(documentPreviewStore: DocumentPreviewStore, id: string) {
  return documentPreviewStore.observePaths({_type: 'reference', _ref: id}, [
    'originalFilename',
    'url',
    'metadata',
    'label',
    'title',
    'description',
    'creditLine',
    'source',
    'size',
  ])
}

export function observeImageAsset(
  documentPreviewStore: DocumentPreviewStore,
  id: string,
): Observable<ImageAsset> {
  return observeAssetDoc(documentPreviewStore, id) as Observable<ImageAsset>
}

/**
 * Observes a video asset for use with AssetSourceDialog and related components.
 * Media Library refs (media-library:ml[id]:[instanceId]) don't exist in the Sanity dataset.
 * When client is provided, fetches the real doc from Media Library API and maps
 * overlapping fields (url, path, mimeType, size, originalFilename, etc.) to Asset shape.
 * Falls back to a minimal synthetic Asset when client is unavailable or fetch fails.
 */
export function observeVideoAsset(
  documentPreviewStore: DocumentPreviewStore,
  id: string,
  client?: SanityClient,
): Observable<VideoAsset> {
  const parsed = parseMediaLibraryRef(id)
  if (!parsed) {
    return observeAssetDoc(documentPreviewStore, id) as Observable<VideoAsset>
  }

  const {mediaLibraryId, assetInstanceId} = parsed
  const minimalAsset = mediaLibraryRefToMinimalAsset(id, assetInstanceId)

  if (!client) {
    return observableOf(minimalAsset)
  }

  const resourceConfig = {
    resource: {type: 'media-library' as const, id: mediaLibraryId},
  }
  const mlClient = client.withConfig({
    ...resourceConfig,
    apiVersion: DEFAULT_API_VERSION,
  })

  return from(
    mlClient.fetch<MediaLibraryVideoDoc | null>(
      '*[_id == $id][0]',
      {id: assetInstanceId},
      {tag: 'media-library.observe-video-asset'},
    ),
  ).pipe(
    map((doc) => mapMediaLibraryDocToAsset(doc, id, assetInstanceId)),
    catchError(() => observableOf(minimalAsset)),
    startWith(minimalAsset),
  )
}

export function observeFileAsset(documentPreviewStore: DocumentPreviewStore, id: string) {
  return observeAssetDoc(documentPreviewStore, id) as Observable<FileAsset>
}

function fetchExisting(
  client: SanityClient,
  type: string,
  hash: string,
): Observable<ImageAsset | FileAsset | null> {
  return client.observable.fetch(
    '*[_type == $documentType && sha1hash == $hash][0]',
    {documentType: type, hash},
    {tag: 'asset.find-duplicate'},
  )
}

function readFile(file: Blob | File): Observable<ArrayBuffer> {
  return new Observable((subscriber) => {
    const reader = new FileReader()
    reader.onload = () => {
      subscriber.next(reader.result as ArrayBuffer)
      subscriber.complete()
    }
    reader.onerror = (err) => {
      subscriber.error(err)
    }
    reader.readAsArrayBuffer(file)
    return () => {
      reader.abort()
    }
  })
}

function hashFile(file: File | Blob): Observable<string | null> {
  if (!window.crypto || !window.crypto.subtle || !window.FileReader) {
    return observableOf(null)
  }
  return readFile(file).pipe(
    mergeMap((arrayBuffer) => crypto.subtle.digest('SHA-1', arrayBuffer)),
    map(hexFromBuffer),
  )
}

function hexFromBuffer(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('')
}
