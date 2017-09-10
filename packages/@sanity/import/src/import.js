const debug = require('debug')('sanity:import')
const flatten = require('lodash/flatten')
const validateOptions = require('./validateOptions')
const streamToArray = require('./streamToArray')
const {getAssetRefs, unsetAssetRefs} = require('./assetRefs')
const assignArrayKeys = require('./assignArrayKeys')
const uploadAssets = require('./uploadAssets')
const batchDocuments = require('./batchDocuments')
const importBatches = require('./importBatches')
const {
  getStrongRefs,
  weakenStrongRefs,
  setTypeOnReferences,
  strengthenReferences
} = require('./references')

async function importFromStream(stream, opts) {
  const options = validateOptions(stream, opts)

  // Get raw documents from the stream
  debug('Streaming input source to array of documents')
  const raw = await streamToArray(stream)

  // User might not have applied `_key` on array elements which are objects;
  // if this is the case, generate random keys to help realtime engine
  const keyed = raw.map(doc => assignArrayKeys(doc))

  // Sanity prefers to have a `_type` on every object. Make sure references
  // has `_type` set to `reference`.
  const docs = keyed.map(doc => setTypeOnReferences(doc))

  // Find references that will need strengthening when import is done
  const strongRefs = docs.map(getStrongRefs)

  // Extract asset references from the documents
  const assetRefs = flatten(docs.map(getAssetRefs).filter(ref => ref.length))

  // Remove asset references from the documents
  const assetless = docs.map(unsetAssetRefs)

  // Make strong references weak so they can be imported in any order
  const weakened = assetless.map(weakenStrongRefs)

  // Create batches of documents to import. Try to keep batches below a certain
  // byte-size (since document may vary greatly in size depending on type etc)
  const batches = batchDocuments(weakened)

  // Trigger actual import process
  debug('Starting import of documents')
  const docsImported = await importBatches(batches, options)

  // Documents are imported, now proceed with post-import operations
  debug('Uploading assets')
  await uploadAssets(assetRefs, options)

  // Strengthen references
  debug('Strengthening references')
  await strengthenReferences(strongRefs, options)

  // Return number of documents imported
  return docsImported
}

module.exports = importFromStream
