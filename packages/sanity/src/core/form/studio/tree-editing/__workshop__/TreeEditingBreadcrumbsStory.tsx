import {Schema} from '@sanity/schema'
import {Container, Flex} from '@sanity/ui'
import {useState} from 'react'
import {type Path} from 'sanity'

import {TreeEditingBreadcrumbs} from '../components'
import {type TreeEditingBreadcrumb} from '../types'

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

const ITEMS: TreeEditingBreadcrumb[] = [
  {
    path: ['first-item', 'first-child'],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'first-item', title: 'First item'},
    parentSchemaType: schema.get('testDocument'),
    children: [
      {
        path: ['first-item', 'first-child'],
        schemaType: schema.get('testDocument').fields[0].type,
        value: {_key: 'first-item', title: 'First item'},
        parentSchemaType: schema.get('testDocument'),
      },
      {
        path: ['second-item', 'first-child', 'first-grandchild'],
        schemaType: schema.get('testDocument').fields[0].type,
        value: {_key: 'first-grandchild', title: 'First grandchild'},
        parentSchemaType: schema.get('testDocument'),
      },
      {
        path: ['second-item', 'first-child', 'second-grandchild'],
        schemaType: schema.get('testDocument').fields[0].type,
        value: {_key: 'second-grandchild', title: 'Second grandchild'},
        parentSchemaType: schema.get('testDocument'),
      },
    ],
  },
  {
    path: ['third-item'],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'third-item', title: 'Third item'},
    parentSchemaType: schema.get('testDocument'),
  },
]

export default function TreeEditingBreadcrumbsStory(): JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path>(['second-item'])

  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <TreeEditingBreadcrumbs
          items={ITEMS}
          onPathSelect={setSelectedPath}
          selectedPath={selectedPath}
        />
      </Container>
    </Flex>
  )
}
