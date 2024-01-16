/* eslint-disable consistent-return */
import {set} from 'sanity'
import {isEqual} from 'lodash'
import {defineMigration} from '@sanity/migrate'

export default defineMigration({
  name: 'Convert string to PortableText at `some.path` in documents of type `someType`',
  documentType: 'someType',
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
