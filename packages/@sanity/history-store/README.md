# History store

Divine the history of a document

## Usage

```js
import {HistoryFetcher} from 'path/to/fetcher'

// documentId can also be an array of documentIds
// unless time is given, will default to now
// revision is optional
HistoryFetcher.getHistory(documentId, {
  time: 'utc-formatted-timstamp',
  revision: 'revision-number'
}).then(ndjson => {
  console.log('transactions, formatted as ndjson', ndjson)
})

// documentId can also be an array of documentIds
HistoryFetcher.getTransactions(documentId).then(ndjson => {
  console.log('transactions, formatted as ndjson', ndjson)
})
```
