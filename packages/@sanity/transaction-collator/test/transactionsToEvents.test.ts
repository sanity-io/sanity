import {readFileSync} from 'fs'
import {transactionsToEvents} from '../src/index'
const ndJSON = readFileSync('./test/fixtures/transactions.ndjson', 'utf8')
const documentId = '6747618f-b457-4709-b6e1-3c1d065a4ab2'

test('groups ', () => {
  const result = transactionsToEvents(documentId, ndJSON)
  console.log(result)
  expect(result).toMatchSnapshot()
})
