import {readFileSync} from 'fs'
import {transactionsToEvents} from '../src/index'
const ndJSON = readFileSync('./test/fixtures/transactions_truncated.ndjson', 'utf8')
const documentIds = ['team-f0b2a4cf7a936ac478f8ec25d341d1edbd592ab5', 'drafts.team-f0b2a4cf7a936ac478f8ec25d341d1edbd592ab5']

test('classifies transactions to events ', () => {
  const result = transactionsToEvents(documentIds, ndJSON)
  expect(result).toMatchSnapshot()
})
