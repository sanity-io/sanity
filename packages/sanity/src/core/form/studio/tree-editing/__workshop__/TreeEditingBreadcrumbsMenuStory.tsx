import {Schema} from '@sanity/schema'
import {type Path} from '@sanity/types'
import {Container, Flex} from '@sanity/ui'
import {useState} from 'react'

import {TreeEditingBreadcrumbsMenu} from '../components/breadcrumbs/TreeEditingBreadcrumbsMenu'
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

const items: TreeEditingBreadcrumb[] = [
  {
    path: ['first-item'],
    children: [],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'first-item', title: 'First item'},
    parentSchemaType: schema.get('testDocument'),
  },
  {
    path: ['second-item'],
    children: [],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'second-item', title: 'Second item'},
    parentSchemaType: schema.get('testDocument'),
  },
  {
    path: ['third-item'],
    children: [],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'third-item', title: 'Third item'},
    parentSchemaType: schema.get('testDocument'),
  },
]

export default function TreeEditingBreadcrumbsMenuStory(): React.JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path>(['second-item'])

  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <TreeEditingBreadcrumbsMenu
          items={items}
          onPathSelect={setSelectedPath}
          selectedPath={selectedPath}
        />
      </Container>
    </Flex>
  )
}
