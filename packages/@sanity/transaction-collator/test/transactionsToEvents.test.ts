import {readFileSync} from 'fs'
import {transactionsToEvents} from '../src/index'
const ndJSON = readFileSync('./test/fixtures/transactions.ndjson', 'utf8')
const documentIds = ['fkaBMrgakwvEbFBu2QkLGy', 'drafts.fkaBMrgakwvEbFBu2QkLGy']

test('classifies transactions to events ', () => {
  const result = transactionsToEvents(documentIds, ndJSON)
  console.log(result)
  expect(result).toMatchSnapshot()
})
