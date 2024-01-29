/* eslint-disable consistent-return */
import {defineMigration, unset} from 'sanity/migrate'

export default defineMigration({
  title: 'Cleanup empty values',
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
