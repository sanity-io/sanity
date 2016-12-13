const createDocumentStore = require('../src')
const mockServerConnection = require('./mock-db/mockServerConnection')

const documents = createDocumentStore({serverConnection: mockServerConnection})

const wait = (ms, fn) => setTimeout(fn, ms)

const sub1 = documents.byId(12).subscribe(event => {
  console.log('subscription for 12 only got event:', event)
})

wait(100, () => {
  const sub2 = documents.byIds([11, 12]).subscribe(event => {
    console.log('subscription for 11 and 12 got event:', event)
  })
  wait(2500, () => sub2.unsubscribe())
})

wait(500, () => sub1.unsubscribe())
