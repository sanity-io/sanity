import {createIfNotExists, defineMigration} from 'sanity/migrate'

declare function fetchGoogleSpreadSheet(id: string): AsyncIterable<Record<string, string>>

// defineSync?
export default defineMigration({
  name: 'Sync from some spreadsheet somewhere',
  documentTypes: ['someType'],
  async *migrate() {
    for await (const row of fetchGoogleSpreadSheet('some-spreadsheet-id')) {
      yield createIfNotExists({_type: 'someType', _id: row.id, name: row.name})
    }
  },
})
