const {range, keyBy, groupBy, flatten} = require('lodash')
const pubsub = require('nano-pubsub')
const {Observable} = require('rxjs')
const assert = require('assert')
const {Patcher} = require('@sanity/mutator')

function randomString() {
  return Math.random()
    .toString(32)
    .substring(2)
}

function randomInt(max) {
  return Math.abs(Math.random() * max)
}

const RECORDS = range(100).map(createRecord)

const INDEX = keyBy(RECORDS, 'id')
const delay = ms =>
  new Observable(observer => {
    const timeout = setTimeout(() => {
      observer.next()
      observer.complete()
    }, ms)
    return () => clearTimeout(timeout)
  })

function createRecord(id, snapshot = {}) {
  return {
    id: id,
    snapshot: Object.assign(
      {
        _id: id,
        _rev: 0
      },
      snapshot
    ),
    events: pubsub()
  }
}

function mutationResponse({nextDocument, transactionId, operation}) {
  return {
    transactionId: transactionId,
    results: [
      {
        id: nextDocument._id,
        operation: operation
      }
    ]
  }
}

function mutationEvent({transactionId, document, mutations, previousDocument}) {
  return {
    eventId: randomString(),
    documentId: document._id,
    transactionId: transactionId,
    transition: 'update',
    identity: 'mock-only-no-identity',
    mutations: mutations,
    result: document,
    previousRev: previousDocument._rev,
    resultRev: document._rev,
    timestamp: new Date().toISOString()
  }
}

function warnAboutUnsupportedMutationTypes() {
  console.error(new Error('[Warning]: Only patch mutations are supported as of now'))
  warnAboutUnsupportedMutationTypes = () => {}
}

function getRecord(id) {
  const record = INDEX[id]
  if (record) {
    return record
  }
  throw new Error(`No record with id ${id}`)
}

function applyPatch(patch) {
  const record = getRecord(patch.id)
  const prevDocument = record.snapshot
  return new Patcher(patch).apply(prevDocument)
}
function applyPatches(patches) {
  const patchesByDocId = groupBy(patches, 'patch.id')

  // Apply all patches for same ids together
  return Object.keys(patchesByDocId).map(id => {
    const patches = patchesByDocId[id]
    const record = getRecord(id)
    const previousDocument = record.snapshot
    const intermediateDocs = patches.map(mut => applyPatch(mut.patch))
    const nextDocument = intermediateDocs[intermediateDocs.length - 1]
    record.snapshot = nextDocument
    return {
      previousDocument,
      document: nextDocument,
      intermediateDocs,
      mutations: patches
    }
  })
}

function listen(documentId) {
  const record = getRecord(documentId)
  return new Observable(observer => {
    observer.next({
      type: 'snapshot',
      document: record.snapshot
    })
    return record.events.subscribe(event => observer.next(event))
  })
}

module.exports = {
  getAllRecords() {
    return RECORDS.slice()
  },
  listen: listen,
  mutate(payload) {
    const transactionId = payload.transactionId || randomString()
    const patches = payload.mutations.filter(mut => {
      if (!('patch' in mut)) {
        warnAboutUnsupportedMutationTypes()
        return false
      }
      return true
    })

    const patchResults = applyPatches(patches)

    const results = flatten(
      patchResults.map(patchResult => {
        return patchResult.intermediateDocs.map(document => {
          return {
            id: document._id,
            document: document
          }
        })
      })
    )

    const events = patchResults.map(patchResult => {
      return mutationEvent({
        transactionId: transactionId,
        document: patchResult.document,
        mutations: patchResult.mutations,
        previousDocument: patchResult.previousDocument
      })
    })

    events.forEach(event => {
      delay(randomInt(50)).subscribe(() => getRecord(event.documentId).events.publish(event))
    })

    return delay(randomInt(50)).map(() => ({
      transactionId,
      results
    }))
  },
  createRecord(document) {
    const docId = randomString()
    return delay(randomInt(50))
      .map(() => {
        const record = createRecord(docId, document)
        RECORDS.push(record)
        INDEX[record.id] = record
        return record.snapshot
      })
      .map(document =>
        mutationResponse({
          operation: 'create',
          nextDocument: document,
          transactionId: randomString()
        })
      )
  }
}
