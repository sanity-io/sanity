import client from 'part:@sanity/base/client'

function uploadAsset(assetType, asset) {
  return client.observable.assets.upload(assetType, asset.file)
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

export const uploadImage = imageAsset => uploadAsset('image', imageAsset)
export const uploadFile = fileAsset => uploadAsset('file', fileAsset)

export function materializeReference(id) {
  return client.observable
    .getDocument(id)
}
