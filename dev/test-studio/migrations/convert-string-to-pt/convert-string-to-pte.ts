/* eslint-disable consistent-return */
import {isEqual} from 'lodash'
import {defineMigration} from 'sanity/migrate'
import {set} from 'sanity/migrate/mutations'

export default defineMigration({
  name: 'Convert string to PortableText at `some.path` in documents of type `someType`',
  documentTypes: ['someType'],
  migrate: {
    string(node, path, ctx) {
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
