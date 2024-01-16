export const renameField = `
import {defineNodeMigration} from '@sanity/migrate'
import {patch, at, set, unset} from '@sanity/migrate/mutations'

export default defineNodeMigration({
  name: '%migrationName%',
  type: '%type%',
  document(doc) {
    return patch(doc._id, [
      at('address', set(doc.location)),
      at('location', unset())
    ])
  },
})
`
