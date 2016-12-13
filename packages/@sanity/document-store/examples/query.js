const createDocumentStore = require('../src')
const mockServerConnection = require('./mock-db/mockServerConnection')

const documents = createDocumentStore({serverConnection: mockServerConnection})

const wait = (ms, fn) => setTimeout(fn, ms)

const sub1 = documents.query('hello').subscribe(event => {
  console.log('subscription query event:', event)
})
