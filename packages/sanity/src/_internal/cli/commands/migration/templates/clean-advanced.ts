export const cleanAdvanced = `
import {mutations, defineMigration} from 'sanity/migrate'

export default defineMigration({
  name: '%migrationName%',
  documentType: '%type%',
  *migrate(documents) {
    for await (const document in documents) {
      yield mutations.createIfNotExists(document)
    }
  }
})
`
