/* eslint-disable consistent-return */
import {set} from 'sanity'
import {isEqual} from 'lodash'
import {defineNodeMigration} from '@sanity/migrate'

export default defineNodeMigration({
  name: 'Convert string to PortableText at `some.path` in documents of type `someType`',
  input: {filter: '_type == "someType"'},
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
})
