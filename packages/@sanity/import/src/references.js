const debug = require('debug')('sanity:import')
const pMap = require('p-map')
const {get} = require('lodash')
const {extractWithPath} = require('@sanity/mutator')
const serializePath = require('./serializePath')

const STRENGTHEN_CONCURRENCY = 3
const STRENGTHEN_BATCH_SIZE = 30

function getStrongRefs(doc) {
  return {
    documentId: doc._id,
    references: findStrongRefs(doc).map(serializePath)
  }
}

// Note: mutates in-place
function weakenStrongRefs(doc) {
  const refs = findStrongRefs(doc)

  refs.forEach(item => {
    item.ref._weak = true
  })

  return doc
}

// Note: mutates in-place
function setTypeOnReferences(doc) {
  extractWithPath('..[_ref]', doc)
    .map(match => match.path.slice(0, -1))
    .map(path => ({path, ref: get(doc, path)}))
    .filter(item => item.ref._type !== 'reference')
    .forEach(item => {
      item.ref._type = 'reference'
    })

  return doc
}

function findStrongRefs(doc) {
  return extractWithPath('..[_ref]', doc)
    .map(match => match.path.slice(0, -1))
    .map(path => ({path, ref: get(doc, path)}))
    .filter(item => item.ref._weak !== true)
}

function strengthenReferences(strongRefs, options) {
  const {client} = options

  const batches = []
  for (let i = 0; i < strongRefs.length; i += STRENGTHEN_BATCH_SIZE) {
    batches.push(strongRefs.slice(i, i + STRENGTHEN_BATCH_SIZE))
  }

  const mapOptions = {concurrency: STRENGTHEN_CONCURRENCY}
  return pMap(batches, unsetWeakBatch.bind(null, client), mapOptions)
}

function unsetWeakBatch(client, batch) {
  debug('Strengthening batch of %d documents', batch.length)
  return batch
    .reduce(reducePatch, client.transaction())
    .commit()
    .then(res => res.results.length)
}

function reducePatch(trx, task) {
  return trx.patch(task.documentId, patch => patch.unset(task.references))
}

exports.getStrongRefs = getStrongRefs
exports.weakenStrongRefs = weakenStrongRefs
exports.setTypeOnReferences = setTypeOnReferences
exports.strengthenReferences = strengthenReferences
