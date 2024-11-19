import {type ProgressEvent, type SanityAssetDocument, type SanityClient} from '@sanity/client'
import {type FileAsset, type ImageAsset} from '@sanity/types'
import {Observable, of as observableOf, of} from 'rxjs'
import {catchError, map, mergeMap, retry, switchMap} from 'rxjs/operators'

import {type DocumentPreviewStore} from '../../../../preview'
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
 *
 *
 */
// note: there's currently 100% overlap between the ImageAsset document and the FileAsset documents as per interface required by the image and file input
function observeAssetDoc(documentPreviewStore: DocumentPreviewStore, id: string) {
  return documentPreviewStore
    .observePaths({_type: 'reference', _ref: id}, [
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
    .pipe(
      /**
       * In some cases when uploading large media file we are getting an stale `null` response from content lake when fetching the reference that was just uploaded,
       * making the UI not to react as it should.
       * This retry logic is added to handle the case where the asset is not found in the initial fetch to the documentPreviewStore but it will eventually be found,
       * because the asset has been just added.
       * It has the downside that if this is being used to check if an asset exists, it will retry 5 times before returning null.
       */
      switchMap((result) => {
        // If the result is null, throw an error to trigger retry
        if (result === null) {
          throw new Error(`No asset found in documentPreviewStore with id: ${id}`)
        }
        // If the result is not null, return the result
        return of(result)
      }),
      retry({
        count: 5,
        delay: 1000,
      }),
      catchError((err) => {
        console.error('Final error after retries, asset not found in documentPreviewStore:', err)
        return of(null) // Return null if the asset is not found
      }),
    )
}

export function observeImageAsset(documentPreviewStore: DocumentPreviewStore, id: string) {
  return observeAssetDoc(documentPreviewStore, id) as Observable<ImageAsset>
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
