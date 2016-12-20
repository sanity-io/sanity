import crypto from 'crypto'
import {get} from 'lodash'
import through2 from 'through2'
import promiseEach from 'promise-each-concurrency'
import {extractWithPath} from '@sanity/mutator'
import getStreamForUri from '../../../util/getStreamForUri'
import debug from '../../../debug'

const assetKey = '_sanityAsset'
const assetMatcher = /^(file|image)@([a-z]+:\/\/.*)/

export default options => {
  const {client, replace} = options

  return through2.obj((doc, enc, cb) => {
    const assets = extractWithPath(`..[${assetKey}]`, doc)
      .map(match => match.path.slice(0, -1))
      .map(path => get(doc, path))
      .map(extractUrlParts)
      .filter(item => item.asset)

    // Ensure images exist in Sanity. This also mutates the in-memory document,
    // replacing {_sanityAsset: 'url'} with {asset: {_ref: 'some/documentId'}}
    promiseEach(assets, uploadAsset, {concurrency: 3})
      .then(() => cb(null, doc))
      .catch(err => cb(err))
  })

  async function uploadAsset(item) {
    // First, ensure that we have uploaded the item to Sanity
    const assetDocId = await ensureAsset(item)

    // Secondly, mutate (yes, in-place) the ref to now hold an actual reference
    delete item.ref[assetKey]
    item.ref._type = item.asset.type
    item.ref.asset = {_ref: assetDocId}
  }

  // Checks for existing asset or uploads new one. Returns document ID
  async function ensureAsset(item) {
    const label = getHash(item.asset.url)

    // See if the item exists on the server
    const docs = await getWithLabel(client, item.asset.type, label)
    if (docs.length > 1) {
      throw new Error(`More than one asset with the label "${label}" found, can't reason about import state`)
    } else if (docs.length === 1 && replace) {
      // In replace mode, we want to replace the asset with a new one
      await client.assets.delete(docs[0])
    } else if (docs.length === 1) {
      // In NON-replace mode, we want to reuse the asset
      return docs[0]
    }

    // If it doesn't exist, we want to upload it
    debug('Uploading %s with URL %s', item.asset.type, item.asset.url)
    const stream = await getStreamForUri(item.asset.url)
    const asset = await (client.assets.upload(item.asset.type, stream, {label}).toPromise())
    return asset.document._id
  }
}

function extractUrlParts(ref) {
  const [, type, url] = ref[assetKey].match(assetMatcher) || []
  return {ref, asset: type ? {type, url} : null}
}

async function getWithLabel(client, type, label) {
  const dataType = type === 'file' ? 'sanity.fileAsset' : 'sanity.imageAsset'
  const query = `${dataType}[label == $label, limit: 2]{_id}`
  return (await client.fetch(query, {label})).map(doc => doc._id)
}

function getHash(url) {
  return crypto.createHash('md5').update(`url:${url}`).digest('hex')
}
