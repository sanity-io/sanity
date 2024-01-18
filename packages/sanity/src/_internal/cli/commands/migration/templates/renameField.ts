export const renameField = `
import {mutations, defineMigration} from 'sanity/migrate'
import {patch, at, set, unset} from 'sanity/migrate/mutations'

export default defineMigration({
  name: '%migrationName%',
  documentType: '%type%',
  migrate: {
  }
})
`
