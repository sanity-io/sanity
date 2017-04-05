import client from 'part:@sanity/base/client'

function uploadAsset(assetType, file) {
  return client.observable.assets.upload(assetType, file)
    .map(event => {
      if (event.type === 'response') {
        // rewrite to a 'complete' event
        return {
          type: 'complete',
          id: event.body.document._id,
          asset: event.body.document
        }
      }
      return event
    })
}

export const uploadImage = file => uploadAsset('image', file)
export const uploadFile = file => uploadAsset('file', file)

export function materializeReference(id) {
  return client.observable
    .getDocument(id)
}
