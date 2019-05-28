import {readFileSync} from 'fs'
import {transactionsToEvents} from '../src/index'
const ndJSON = readFileSync('./test/fixtures/transactions.ndjson', 'utf8')
const documentId = '33d64a8a-daaf-41e7-849f-657460c33559'

test('parses ndjson', () => {
  const result = transactionsToEvents(documentId, ndJSON)
  console.log(result)
  expect(result).toMatchSnapshot()
})
