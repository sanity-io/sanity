import {readFileSync} from 'fs'
import path from 'path'
import {transactionsToEvents} from '../src/index'

const ndJSON = readFileSync(path.join(__dirname, './fixtures/transactions.ndjson'), 'utf8')
const documentIds = ['fkaBMrgakwvEbFBu2QkLGy', 'drafts.fkaBMrgakwvEbFBu2QkLGy']

test('classifies transactions to events ', () => {
  const result = transactionsToEvents(documentIds, ndJSON)
  expect(result).toMatchSnapshot()
})
