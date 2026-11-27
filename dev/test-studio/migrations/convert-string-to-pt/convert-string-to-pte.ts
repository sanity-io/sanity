import {set} from '@sanity/migrate'
/* oxlint-disable consistent-return */
import isEqual from 'lodash-es/isEqual.js'
import {defineMigration} from 'sanity/migrate'

export default defineMigration({
  title: 'Convert string to PortableText at `some.path` in documents of type `someType`',
  documentTypes: ['someType'],
  migrate: {
    string(node, path) {
      if (isEqual(path, ['some', 'path'])) {
        return set([
          {
            style: 'normal',
            _type: 'block',
            children: [
              {
                _type: 'span',
                marks: [],
                text: node,
              },
            ],
            markDefs: [],
          },
        ])
      }
    },
  },
})
