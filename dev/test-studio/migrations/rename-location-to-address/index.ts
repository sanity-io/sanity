import {defineMigration} from '@sanity/migrate'
import {at, patch, set} from '@sanity/migrate/mutations'

export default defineMigration({
  name: 'Rename Location to Address',
  documentType: 'author',
  migrate: {
    document(doc) {
      return patch(doc._id, [at('address', set('Somehwere'))])
    },
  },
})
