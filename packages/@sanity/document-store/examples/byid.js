const createDocumentStore = require('../src')
const mockServerConnection = require('./mock-db/mockServerConnection')

const documents = createDocumentStore({serverConnection: mockServerConnection})

const wait = (ms, fn) => setTimeout(fn, ms)
const log = prefix => (...args) => console.log(`${prefix}: `, ...args)

const subscription1 = documents.byId('12').subscribe(log('subscriber1'))

const subscription2 = documents.byId('12').subscribe(log('subscriber2'))

wait(500, () => {
  console.log('  subscribing 3')
  const subscriber3 = documents.byId('12').subscribe(log('subscriber2'))
  console.log('  unsubscribing 3')
  subscriber3.unsubscribe()
})

wait(1000, () => {
  subscription1.unsubscribe()
})

wait(1500, () => {
  subscription2.unsubscribe()
})

wait(2000, () => {
  const latecomer = documents.byId(12).subscribe(log('latecomer'))
  wait(500, () => latecomer.unsubscribe())
})
