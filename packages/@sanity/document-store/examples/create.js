const createDocumentStore = require('../src')
const mockServerConnection = require('./helpers/mockServerConnection')

const documents = createDocumentStore({serverConnection: mockServerConnection})

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const log = prefix => (...args) => console.log(`${prefix}: `, ...args)


const create = documents.create({_type: 'test'})

create.subscribe(log('created'))

create
  .flatMap(ev => documents.byId(ev.results[0].id))
  .subscribe(log('doc event:'))

wait(1000).then(() => {
  create.flatMap(ev => {
    return documents.update(ev.results[0].id, {
      patch: {
        set: {
          foo: 'bar'
        }
      }
    })
  })
    .subscribe(log('Create + update complete'))
})
