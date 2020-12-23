import client from 'part:@sanity/base/client'
import {observePaths} from 'part:@sanity/base/preview'
import {mergeMap, map, catchError} from 'rxjs/operators'
import {from as observableFrom, Observable, of as observableOf} from 'rxjs'
import {FileAsset} from '@sanity/types'
import {withMaxConcurrency} from '../../utils/withMaxConcurrency'
import {UploadOptions} from '../../uploads/types'

const MAX_CONCURRENT_UPLOADS = 4

function uploadSanityAsset(assetType, file, options: UploadOptions = {}) {
  const extract = options.metadata
  const preserveFilename = options.storeOriginalFilename
  const {label, title, description, creditLine, source} = options
  return observableFrom(hashFile(file)).pipe(
    catchError((
      error // ignore if hashing fails for some reason
    ) => observableOf(null)),
    mergeMap((hash) =>
      hash ? fetchExisting(`sanity.${assetType}Asset`, hash) : observableOf(null)
    ),
    mergeMap((existing: any) => {
      if (existing) {
        return observableOf({
          // complete with the existing asset document
          type: 'complete',
          id: existing._id,
          asset: existing,
        })
      }
      return client.observable.assets
        .upload(assetType, file, {
          extract,
          preserveFilename,
          label,
          title,
          description,
          creditLine,
          source,
        })
        .pipe(
          map((event: any) =>
            event.type === 'response'
              ? {
                  // rewrite to a 'complete' event
                  type: 'complete',
                  id: event.body.document._id,
                  asset: event.body.document,
                }
              : event
          )
        )
    })
  )
}

const uploadAsset = withMaxConcurrency(uploadSanityAsset, MAX_CONCURRENT_UPLOADS)

export const uploadImageAsset = (file, options) => uploadAsset('image', file, options)
export const uploadFileAsset = (file, options) => uploadAsset('file', file, options)

export function materializeReference(id) {
  return observePaths(id, [
    'originalFilename',
    'url',
    'metadata',
    'label',
    'title',
    'description',
    'creditLine',
    'source',
  ]) as Observable<FileAsset>
}

function fetchExisting(type, hash) {
  return client.observable.fetch('*[_type == $documentType && sha1hash == $hash][0]', {
    documentType: type,
    hash,
  })
}

function readFile(file): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function hashFile(file) {
  if (!window.crypto || !window.crypto.subtle || !window.FileReader) {
    return Promise.resolve(null)
  }
  return readFile(file)
    .then((arrayBuffer) => crypto.subtle.digest('SHA-1', arrayBuffer))
    .then(hexFromBuffer)
}

function hexFromBuffer(buffer: ArrayBuffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('')
}
