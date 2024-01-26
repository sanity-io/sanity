/* eslint-disable consistent-return */
import {defineMigration} from 'sanity/migrate'
import {unset} from 'sanity/migrate/mutations'

export default defineMigration({
  name: 'Cleanup empty values',
  documentTypes: ['playlist', 'species'],
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
