import {defineMigration} from '@sanity/migrate'
import {createIfNotExists} from '@sanity/migrate/mutations'

declare function fetchGoogleSpreadSheet(id: string): AsyncIterable<Record<string, string>>

// defineSync?
export default defineMigration({
  name: 'Sync from some spreadsheet somewhere',
  input: null,
  async *run() {
    for await (const row of fetchGoogleSpreadSheet('some-spreadsheet-id')) {
      yield createIfNotExists({_type: 'someType', _id: row.id, name: row.name})
    }
  },
})
