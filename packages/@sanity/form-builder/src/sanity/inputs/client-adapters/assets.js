import client from 'part:@sanity/base/client'
import {observePaths} from 'part:@sanity/base/preview'
import {withMaxConcurrency} from '../../utils/withMaxConcurrency'

const MAX_CONCURRENT_UPLOADS = 4

function uploadSanityAsset(assetType, file) {
  return client.observable.assets.upload(assetType, file).map(event => {
    return event.type === 'response'
      ? {
          // rewrite to a 'complete' event
          type: 'complete',
          id: event.body.document._id,
          asset: event.body.document
        }
      : event
  })
}

const uploadAsset = withMaxConcurrency(uploadSanityAsset, MAX_CONCURRENT_UPLOADS)

export const uploadImageAsset = file => uploadAsset('image', file)
export const uploadFileAsset = file => uploadAsset('file', file)

export function materializeReference(id) {
  return observePaths(id, ['originalFilename', 'url', 'metadata'])
}
