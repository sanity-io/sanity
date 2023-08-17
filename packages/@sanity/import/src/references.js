const debug = require('debug')('sanity:import')
const pMap = require('p-map')
const {get} = require('lodash')
const {extractWithPath} = require('@sanity/mutator')
const serializePath = require('./serializePath')
const progressStepper = require('./util/progressStepper')
const retryOnFailure = require('./util/retryOnFailure')
const suffixTag = require('./util/suffixTag')

const STRENGTHEN_CONCURRENCY = 1
const STRENGTHEN_BATCH_SIZE = 30

function getStrongRefs(doc) {
  const refs = findStrongRefs(doc).map(serializePath)
  if (refs.length) {
    return {
      documentId: doc._id,
      references: refs,
    }
  }

  return null
}

// Note: mutates in-place
function weakenStrongRefs(doc) {
  const refs = findStrongRefs(doc)

  refs.forEach((item) => {
    item.ref._weak = true
  })

  return doc
}

// Note: mutates in-place
function cleanupReferences(doc, options) {
  const {targetProjectId, skipCrossDatasetReferences} = options
  extractWithPath('..[_ref]', doc)
    .map((match) => match.path.slice(0, -1))
    .map((path) => ({path, ref: get(doc, path)}))
    .forEach((item) => {
      // We may want to skip cross-dataset references, eg when importing to other projects
      if (skipCrossDatasetReferences && '_dataset' in item.ref) {
        const leaf = item.path[item.path.length - 1]
        const parent = item.path.length > 1 ? get(doc, item.path.slice(0, -1)) : doc
        delete parent[leaf]
        return
      }

      // Apply missing _type on references
      if (typeof item.ref._type === 'undefined') {
        item.ref._type = 'reference'
      }

      // Ensure cross-dataset references point to the same project ID as being imported to
      if (typeof item.ref._projectId !== 'undefined') {
        item.ref._projectId = targetProjectId
      }
    })

  return doc
}

function findStrongRefs(doc) {
  return extractWithPath('..[_ref]', doc)
    .map((match) => match.path.slice(0, -1))
    .map((path) => ({path, ref: get(doc, path)}))
    .filter((item) => item.ref._weak !== true)
}

function strengthenReferences(strongRefs, options) {
  const {client, tag} = options

  const batches = []
  for (let i = 0; i < strongRefs.length; i += STRENGTHEN_BATCH_SIZE) {
    batches.push(strongRefs.slice(i, i + STRENGTHEN_BATCH_SIZE))
  }

  if (batches.length === 0) {
    return Promise.resolve([0])
  }

  const progress = progressStepper(options.onProgress, {
    step: 'Strengthening references',
    total: batches.length,
  })

  const mapOptions = {concurrency: STRENGTHEN_CONCURRENCY}
  return pMap(batches, unsetWeakBatch.bind(null, client, progress, tag), mapOptions)
}

function unsetWeakBatch(client, progress, tag, batch) {
  debug('Strengthening batch of %d documents', batch.length)
  return retryOnFailure(
    () =>
      batch
        .reduce(reducePatch, client.transaction())
        .commit({visibility: 'async', tag: suffixTag(tag, 'ref.strengthen')})
        .then(progress)
        .then((res) => res.results.length)
        .catch((err) => {
          err.step = 'strengthen-references'
          throw err
        }),
    {isRetriable: (err) => !err.statusCode || err.statusCode !== 409},
  )
}

function reducePatch(trx, task) {
  return trx.patch(task.documentId, (patch) =>
    patch.unset(task.references.map((path) => `${path}._weak`)),
  )
}

exports.getStrongRefs = getStrongRefs
exports.weakenStrongRefs = weakenStrongRefs
exports.cleanupReferences = cleanupReferences
exports.strengthenReferences = strengthenReferences
