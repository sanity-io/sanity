import client from 'part:@sanity/base/client'
import {observePaths} from 'part:@sanity/base/preview'
import {withMaxConcurrency} from '../../utils/withMaxConcurrency'
import Observable from '@sanity/observable'

const MAX_CONCURRENT_UPLOADS = 4

function uploadSanityAsset(assetType, file) {
  return Observable.from(hashFile(file))
    .catch(error =>
      // ignore if hashing fails for some reason
      Observable.of(null)
    )
    .mergeMap(
      hash => (hash ? fetchExisting(`sanity.${assetType}Asset`, hash) : Observable.of(null))
    )
    .mergeMap(existing => {
      if (existing) {
        return Observable.of({
          // complete with the existing asset document
          type: 'complete',
          id: existing._id,
          asset: existing
        })
      }
      return client.observable.assets.upload(assetType, file).map(
        event =>
          event.type === 'response'
            ? {
                // rewrite to a 'complete' event
                type: 'complete',
                id: event.body.document._id,
                asset: event.body.document
              }
            : event
      )
    })
}

const uploadAsset = withMaxConcurrency(uploadSanityAsset, MAX_CONCURRENT_UPLOADS)

export const uploadImageAsset = file => uploadAsset('image', file)
export const uploadFileAsset = file => uploadAsset('file', file)

export function materializeReference(id) {
  return observePaths(id, ['originalFilename', 'url', 'metadata'])
}

function fetchExisting(type, hash) {
  return client.observable.fetch('*[_type == $documentType && sha1hash == $hash][0]', {
    documentType: type,
    hash
  })
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function hashFile(file) {
  if (!window.crypto || !window.crypto.subtle || !window.FileReader) {
    return Promise.resolve(null)
  }
  return readFile(file)
    .then(arrayBuffer => crypto.subtle.digest('SHA-1', arrayBuffer))
    .then(hexFromBuffer)
}

function hexFromBuffer(buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), x => `00${x.toString(16)}`.slice(-2))
    .join('')
}
