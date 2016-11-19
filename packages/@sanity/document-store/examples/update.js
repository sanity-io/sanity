const createDocumentStore = require('../src')
const mockServerConnection = require('./helpers/mockServerConnection')
const firstOf = require('../src/utils/firstOf')

const documents = createDocumentStore({serverConnection: mockServerConnection})

const wait = (ms, fn) => setTimeout(fn, ms)

const snapshots = documents.byId(12)
  .filter(event => event.type === 'snapshot')
  .subscribe(event => {
    console.log('Got snapshot of document #12:', event.document)
  })

const updates = firstOf(documents.byId(12).filter(event => event.type === 'update'))
  .subscribe(event => {
    console.log('Document 12 updated:', event)
  })

wait(500, () => {
  console.log('Update init')
  documents.update(12, {patch: {set: {body: 'UPDATED'}}})
    .subscribe({
      next() {
        console.log('Updating...')
      },
      error(err) {
        console.error(err)
      },
      complete() {
        console.log('Update complete')
      }
    })
})

const first = documents.byId(22).subscribe(event => {
  console.log('event', event)
})
const second = documents.byId(22).subscribe(event => {
  console.log('GOT EVENT', event)
})

wait(1000, () => {
  documents.update('44', {patch: {set: {body: 'LOCAL APPLIED'}}})
})

wait(2000, () => {
  second.unsubscribe()
})
