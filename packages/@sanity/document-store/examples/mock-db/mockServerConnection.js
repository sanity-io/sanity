const debug = require('../../src/utils/debug')
const db = require('./db')

function byId(documentId) {
  debug('Mock server is "fetching" document with id %s', documentId)
  return db.listen(documentId)
}

function query(q) {
  debug(`setting up subscription for query "${q}"`)
  return db.getAllRecords()
}

function mutate(payload) {
  return db.mutate(payload)
}

function create(document) {
  return db.createRecord(document)
}

module.exports = {
  byId,
  mutate,
  query,
  create
}
