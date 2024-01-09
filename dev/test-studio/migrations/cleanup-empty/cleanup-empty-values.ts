/* eslint-disable consistent-return */
import {unset} from '@sanity/migrate/mutations'
import {defineNodeMigration} from '@sanity/migrate'

export default defineNodeMigration({
  name: 'Cleanup empty values',
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
})
