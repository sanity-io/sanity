const createDocumentStore = require('../src')
const mockServerConnection = require('./mock-db/mockServerConnection')

const documentStore = createDocumentStore({serverConnection: mockServerConnection})

const wait = (ms, fn) => setTimeout(fn, ms)

const buffered = documentStore.checkout(22)

documentStore.byId(22).subscribe(event => {
  console.log('Got event from byId', event)
})

const mutations = buffered.events.filter(event => event.type === 'mutate').subscribe(event => {
  console.log('Document was mutated:', event)
})

wait(500, () => {
  const buffered2 = documentStore.checkout(22)

  buffered2.events.subscribe(event => {
    console.log('Doc event #22!', event)
  })

  buffered2.patch([{set: {body: 'New body'}}])
  buffered2.commit().subscribe(() => {
    console.log('Committed!')
  })
})

wait(1000, () => {
  buffered.patch([{set: {body: 'UPDATED2'}}])
  buffered.commit()
})

// simulate some other subscriber mutates

wait(2000, () => {
  const doc = documentStore.checkout(22)
  doc.patch([{set: {body: 'UPDATED3'}}])
  doc.commit().subscribe(res => {
    console.log('Committed')
  })

  documentStore.byId(22).subscribe(event => {
    console.log('Got FINAL event from byId', event)
  })
})
