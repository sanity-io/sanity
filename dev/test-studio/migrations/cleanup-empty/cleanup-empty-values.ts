/* eslint-disable consistent-return */
import {unset} from '@sanity/migrate/mutations'
import {defineMigration} from '@sanity/migrate'

export default defineMigration({
  name: 'Cleanup empty values',
  documentType: 'species',
  migrate: {
    object(node) {
      if (Object.keys(node).filter((k) => !k.startsWith('_')).length) {
        return unset()
      }
    },
    array(node) {
      if (node.length === 0) {
        return unset()
      }
    },
    string(node) {
      if (node.length === 0) {
        return unset()
      }
    },
  },
})
