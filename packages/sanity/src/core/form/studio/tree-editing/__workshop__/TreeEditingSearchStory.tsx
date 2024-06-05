import {Schema} from '@sanity/schema'
import {Container, Flex} from '@sanity/ui'

import {TreeEditingSearch} from '../components'
import {type TreeEditingMenuItem} from '../types'

function noop() {
  // ...
}

const schema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'testDocument',
      title: 'Document',
      type: 'document',
      fields: [
        {
          type: 'object',
          name: 'testObject',
          title: 'Object',
          fields: [
            {
              type: 'string',
              name: 'title',
              title: 'Title',
            },
          ],
        },
      ],
    },
  ],
})

const ITEMS: TreeEditingMenuItem[] = [
  {
    path: ['first-item', 'first-child'],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'first-item', title: 'First item'},
    parentSchemaType: schema.get('testDocument').fields[0].type,
    children: [
      {
        path: ['first-item', 'first-child'],
        schemaType: schema.get('testDocument').fields[0].type,
        value: {_key: 'first-item', title: 'First item'},
        parentSchemaType: schema.get('testDocument').fields[0].type,
      },
      {
        path: ['second-item', 'first-child', 'first-grandchild'],
        schemaType: schema.get('testDocument').fields[0].type,
        value: {_key: 'first-grandchild', title: 'First grandchild'},
        parentSchemaType: schema.get('testDocument').fields[0].type,
      },
      {
        path: ['second-item', 'first-child', 'second-grandchild'],
        schemaType: schema.get('testDocument').fields[0].type,
        value: {_key: 'second-grandchild', title: 'Second grandchild'},
        parentSchemaType: schema.get('testDocument').fields[0].type,
      },
    ],
  },
  {
    path: ['third-item'],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'third-item', title: 'Third item'},
    parentSchemaType: schema.get('testDocument').fields[0].type,
    children: [
      {
        path: ['third-item'],
        schemaType: schema.get('testDocument').fields[0].type,
        value: {_key: 'third-item', title: 'Third item'},
        parentSchemaType: schema.get('testDocument').fields[0].type,
      },
    ],
  },
]

export default function TreeEditingSearchStory() {
  return (
    <Flex align="center" height="fill" justify="center">
      <Container width={0}>
        <TreeEditingSearch items={ITEMS} onPathSelect={noop} />
      </Container>
    </Flex>
  )
}
