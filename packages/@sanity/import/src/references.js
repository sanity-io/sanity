const debug = require('debug')('sanity:import')
const pMap = require('p-map')
const {get} = require('lodash')
const {extractWithPath} = require('@sanity/mutator')
const serializePath = require('./serializePath')
const progressStepper = require('./util/progressStepper')
const retryOnFailure = require('./util/retryOnFailure')

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
function setTypeOnReferences(doc) {
  extractWithPath('..[_ref]', doc)
    .map((match) => match.path.slice(0, -1))
    .map((path) => ({path, ref: get(doc, path)}))
    .filter((item) => typeof item.ref._type === 'undefined')
    .forEach((item) => {
      item.ref._type = 'reference'
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
  const {client} = options

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
  return pMap(batches, unsetWeakBatch.bind(null, client, progress), mapOptions)
}

function unsetWeakBatch(client, progress, batch) {
  debug('Strengthening batch of %d documents', batch.length)
  return retryOnFailure(
    () =>
      batch
        .reduce(reducePatch, client.transaction())
        .commit({visibility: 'async'})
        .then(progress)
        .then((res) => res.results.length)
        .catch((err) => {
          err.step = 'strengthen-references'
          throw err
        }),
    {isRetriable: (err) => !err.statusCode || err.statusCode !== 409}
  )
}

function reducePatch(trx, task) {
  return trx.patch(task.documentId, (patch) =>
    patch.unset(task.references.map((path) => `${path}._weak`))
  )
}

exports.getStrongRefs = getStrongRefs
exports.weakenStrongRefs = weakenStrongRefs
exports.setTypeOnReferences = setTypeOnReferences
exports.strengthenReferences = strengthenReferences
