const createDocumentStore = require('../src')
const mockServerConnection = require('./helpers/mockServerConnection')

const documents = createDocumentStore({serverConnection: mockServerConnection})

const wait = (ms, fn) => setTimeout(fn, ms)

const snapshots = documents.byId(12)
  .filter(event => event.type === 'snapshot')
  .subscribe(event => {
    console.log('Got snapshot of document #12:', event.document)
  })

const updates = documents.byId(12)
  .filter(event => event.type === 'update')
  .first()
  .subscribe(event => {
    console.log('Document 12 updated:', event)
  })

wait(500, () => {
  console.log('Update init')
  documents.update(12, {body: {$set: 'UPDATED'}})
    .subscribe({
      next() {
        console.log('Updating...')
      },
      complete() {
        console.log('Update complete')
      }
    })
})

const first = documents.byId("lol32").subscribe(event => {
  console.log('event', event)
})
const second = documents.byId("lol32").subscribe(event => {
  console.log('GOT EVENT', event)
})

wait(1000, () => {
  documents.update("44", {body: {$set: "LOCAL APPLIED"}})
})

wait(2000, () => {
  second.unsubscribe()
})