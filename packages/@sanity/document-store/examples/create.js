const createDocumentStore = require('../src')
const mockServerConnection = require('./mock-db/mockServerConnection')

const documents = createDocumentStore({serverConnection: mockServerConnection})

const log = prefix => (...args) => console.log(`${prefix}: `, ...args)

const create = documents.create({_type: 'test'})

create.subscribe(log('created'))

create.flatMap(ev => documents.byId(ev.results[0].id)).subscribe(log('doc event:'))
