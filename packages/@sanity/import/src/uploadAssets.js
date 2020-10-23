const basename = require('path').basename
const parseUrl = require('url').parse
const debug = require('debug')('sanity:import')
const pMap = require('p-map')
const progressStepper = require('./util/progressStepper')
const getHashedBufferForUri = require('./util/getHashedBufferForUri')
const retryOnFailure = require('./util/retryOnFailure')
const urlExists = require('./util/urlExists')

const ASSET_UPLOAD_CONCURRENCY = 8
const ASSET_PATCH_CONCURRENCY = 1
const ASSET_PATCH_BATCH_SIZE = 50

async function uploadAssets(assets, options) {
  const concurrency = options.assetConcurrency || ASSET_UPLOAD_CONCURRENCY
  debug('Uploading assets with a concurrency of %d', concurrency)

  // Build a Map where the keys are `type#url` and the value is an array of all
  // objects containing document id and path to inject asset reference to.
  // `assets` is an array of objects with shape: {documentId, path, url, type}
  const assetRefMap = getAssetRefMap(assets)

  // We might have additional assets that is not referenced by any documents, but was part of a
  // dataset when exporting, for instance. Add these to the map without any references to update.
  const unreferencedAssets = options.unreferencedAssets || []
  unreferencedAssets.forEach((asset) => {
    if (!assetRefMap.has(asset)) {
      assetRefMap.set(asset, [])
    }
  })

  if (assetRefMap.size === 0) {
    return {
      batches: [0],
      failures: [],
    }
  }

  // Create a function we can call for every completed upload to report progress
  const progress = progressStepper(options.onProgress, {
    step: 'Importing assets (files/images)',
    total: assetRefMap.size,
  })

  // If we should allow failures, we need to use a custom catch handler in order
  // to not set the asset references for the broken assets
  const ensureAssetExists = ensureAssetWithRetries.bind(null, options, progress)
  const ensureMethod = options.allowFailingAssets
    ? (...args) => ensureAssetExists(...args).catch((err) => err)
    : ensureAssetExists

  // Loop over all unique URLs and ensure they exist, and if not, upload them
  const mapOptions = {concurrency}
  const assetIds = await pMap(assetRefMap.keys(), ensureMethod, mapOptions)

  // Extract a list of all failures so we may report them and possibly retry them later
  const assetFailures = getUploadFailures(assetRefMap, assetIds)

  // Loop over all documents that need asset references to be set
  const batches = await setAssetReferences(assetRefMap, assetIds, options)
  return {
    batches: batches.reduce((prev, add) => prev + add, 0),
    failures: assetFailures,
  }
}

function getAssetRefMap(assets) {
  return assets.reduce((assetRefMap, item) => {
    const {documentId, path, url, type} = item
    const key = `${type}#${url}`
    let refs = assetRefMap.get(key)
    if (!refs) {
      refs = []
      assetRefMap.set(key, refs)
    }

    refs.push({documentId, path})
    return assetRefMap
  }, new Map())
}

async function ensureAssetWithRetries(options, progress, assetKey, i) {
  const [type, url] = assetKey.split('#', 2)

  const {buffer, sha1hash} = await retryOnFailure(() => downloadAsset(url, i)).catch((err) => {
    progress()
    err.type = type
    err.url = url
    err.message = err.message.includes(url)
      ? err.message
      : `Failed to download ${type} @ ${url}:\n${err.message}`

    throw err
  })

  const asset = {buffer, sha1hash, type, url}
  return retryOnFailure(() => ensureAsset(asset, options, i))
    .then(progress)
    .catch((err) => {
      progress()
      err.type = type
      err.url = url
      err.message = err.message.includes(url)
        ? err.message
        : `Failed to upload ${type} @ ${url}:\n${err.message}`

      throw err
    })
}

function downloadAsset(url, i) {
  // Download the asset in order for us to create a hash
  debug('[Asset #%d] Downloading %s', i, url)
  return getHashedBufferForUri(url)
}

async function ensureAsset(asset, options, i) {
  const {buffer, sha1hash, type, url} = asset
  const {client, assetMap = {}, replaceAssets} = options

  // See if the item exists on the server
  if (!replaceAssets) {
    debug('[Asset #%d] Checking for asset with hash %s', i, sha1hash)
    const assetDocId = await getAssetDocumentIdForHash(client, type, sha1hash)
    if (assetDocId) {
      // Same hash means we want to reuse the asset
      debug('[Asset #%d] Found %s for hash %s', i, type, sha1hash)
      return assetDocId
    }
  }

  const assetMeta = assetMap[`${type}-${sha1hash}`]
  const hasFilename = assetMeta && assetMeta.originalFilename
  const hasNonFilenameMeta = assetMeta && Object.keys(assetMap).length > 1
  const {pathname} = parseUrl(url)
  const filename = hasFilename ? assetMeta.originalFilename : basename(pathname)

  // If it doesn't exist, we want to upload it
  debug('[Asset #%d] Uploading %s with URL %s', i, type, url)
  const assetDoc = await client.assets.upload(type, buffer, {filename})

  // If we have more metadata to provide, update the asset document
  if (hasNonFilenameMeta) {
    await client.patch(assetDoc._id).set(assetMeta)
  }

  return assetDoc._id
}

async function getAssetDocumentIdForHash(client, type, sha1hash, attemptNum = 0) {
  // @todo remove retry logic when client has reintroduced it
  try {
    const dataType = type === 'file' ? 'sanity.fileAsset' : 'sanity.imageAsset'
    const query = '*[_type == $dataType && sha1hash == $sha1hash][0]{_id, url}'
    const assetDoc = await client.fetch(query, {dataType, sha1hash})
    if (!assetDoc || !assetDoc.url) {
      return null
    }

    const exists = await urlExists(assetDoc.url)
    if (!exists) {
      debug(`Asset document ${assetDoc._id} exists, but file does not. Overwriting.`)
      return null
    }

    return assetDoc._id
  } catch (err) {
    if (attemptNum < 3) {
      return getAssetDocumentIdForHash(client, type, sha1hash, attemptNum + 1)
    }

    err.attempts = attemptNum
    throw new Error(`Error while attempt to query Sanity API:\n${err.message}`)
  }
}

function getUploadFailures(assetRefMap, assetIds) {
  const lookup = assetRefMap.values()

  return assetIds.reduce((failures, assetId) => {
    const documents = lookup.next().value
    if (typeof assetId === 'string') {
      return failures
    }

    return failures.concat({
      type: 'asset',
      url: assetId.url,
      documents: documents.map(({documentId, path}) => ({
        documentId,
        path,
      })),
    })
  }, [])
}

function setAssetReferences(assetRefMap, assetIds, options) {
  const {client} = options
  const lookup = assetRefMap.values()
  const patchTasks = assetIds.reduce((tasks, assetId) => {
    const documents = lookup.next().value
    if (typeof assetId !== 'string') {
      return tasks
    }

    return tasks.concat(
      documents.map(({documentId, path}) => ({
        documentId,
        path,
        assetId,
      }))
    )
  }, [])

  // We now have an array of simple tasks, each containing:
  // {documentId, path, assetId}
  // Instead of doing a single mutation per asset, let's batch them up
  const batches = []
  for (let i = 0; i < patchTasks.length; i += ASSET_PATCH_BATCH_SIZE) {
    batches.push(patchTasks.slice(i, i + ASSET_PATCH_BATCH_SIZE))
  }

  if (batches.length === 0) {
    return Promise.resolve([0])
  }

  // Since separate progress step for batches of reference sets
  const progress = progressStepper(options.onProgress, {
    step: 'Setting asset references to documents',
    total: batches.length,
  })

  // Now perform the batch operations in parallel with a given concurrency
  const mapOptions = {concurrency: ASSET_PATCH_CONCURRENCY}
  const setAssetRefs = setAssetReferenceBatch.bind(null, client, progress)
  return pMap(batches, setAssetRefs, mapOptions)
}

function setAssetReferenceBatch(client, progress, batch) {
  debug('Setting asset references on %d documents', batch.length)
  return retryOnFailure(() =>
    batch
      .reduce(reducePatch, client.transaction())
      .commit({visibility: 'async'})
      .then(progress)
      .then((res) => res.results.length)
  )
}

function getAssetType(assetId) {
  return assetId.slice(0, assetId.indexOf('-'))
}

function reducePatch(trx, task) {
  return trx.patch(task.documentId, (patch) =>
    patch
      .setIfMissing({
        [task.path]: {_type: getAssetType(task.assetId)},
      })
      .set({
        [`${task.path}.asset`]: {
          _type: 'reference',
          _ref: task.assetId,
        },
      })
  )
}

module.exports = uploadAssets
