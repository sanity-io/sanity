import {Schema} from '@sanity/schema'
import {Container, Flex} from '@sanity/ui'
import {useState} from 'react'
import {type Path} from 'sanity'

import {ArrayEditingBreadcrumbsMenu} from '../components'
import {type ArrayEditingBreadcrumb} from '../types'

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

const items: ArrayEditingBreadcrumb[] = [
  {
    path: ['first-item'],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'first-item', title: 'First item'},
  },
  {
    path: ['second-item'],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'second-item', title: 'Second item'},
  },
  {
    path: ['third-item'],
    schemaType: schema.get('testDocument').fields[0].type,
    value: {_key: 'third-item', title: 'Third item'},
  },
]

export default function ArrayEditingBreadcrumbsMenuStory(): JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path>(['second-item'])

  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <ArrayEditingBreadcrumbsMenu
          items={items}
          onPathSelect={setSelectedPath}
          selectedPath={selectedPath}
        />
      </Container>
    </Flex>
  )
}
