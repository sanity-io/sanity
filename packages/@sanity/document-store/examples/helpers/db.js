const {range, keyBy} = require('lodash')
const pubsub = require('nano-pubsub')

function randomId() {
  return Math.random().toString(32).substring(2)
}

const RECORDS = range(100)
  .map(createRecord)

const INDEX = keyBy(RECORDS, 'id')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function createRecord(id, snapshot = {}) {
  return {
    id: id,
    snapshot: Object.assign({
      _id: id,
      _version: 0
    }, snapshot),
    events: pubsub()
  }
}

function mutationResponse(documentId, transactionId, operation) {
  return {
    transactionId: transactionId,
    results: [
      {
        id: documentId,
        operation: operation
      }
    ]
  }
}

function mutationEvent(documentId, transactionId, mutation) {
  return {
    type: 'mutation',
    eventId: randomId(),
    documentId: documentId,
    transactionId: transactionId,
    index: 0,
    transition: 0,
    identity: '',
    mutation: mutation
  }
}

function randomInt(max) {
  return Math.abs(Math.random() * max)
}

function applyMutation(id, transactionId, mutation) {
  const record = INDEX[id]
  if (!record) {
    throw new Error(`No record with id ${id}`)
  }
  const currentVersion = record.snapshot
  const nextVersion = Object.assign({}, currentVersion)

  Object.assign(nextVersion, mutation.patch.set, {_rev: currentVersion._rev})

  delay(randomInt(50)).then(() => {
    record.events.publish(mutationEvent(id, transactionId, mutation))
  })

  return nextVersion
}

module.exports = {
  getAllRecords() {
    return RECORDS.slice()
  },
  getRecord(id) {
    return INDEX[id]
  },
  updateRecord(id, mutation) {
    // todo: actually apply the mutation
    const transactionId = randomId()
    applyMutation(id, transactionId, mutation)
    return delay(randomInt(50)).then(() => mutationResponse(id, transactionId, 'update'))
  },
  createRecord(document) {
    const docId = randomId()
    return delay(randomInt(50)).then(() => {
      const record = createRecord(docId, document)
      RECORDS.push(record)
      INDEX[record.id] = record
    })
      .then(() => mutationResponse(docId, randomId(), 'create'))
  }
}
