import {Schema} from '@sanity/schema'
import {Flex} from '@sanity/ui'
import {useState} from 'react'
import {type Path} from 'sanity'

import {ArrayEditingBreadcrumbsMenuButton} from '../components'
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

const ITEM: ArrayEditingBreadcrumb = {
  path: ['first-item'],
  schemaType: schema.get('testDocument').fields[0].type,
  value: {_key: 'first-item', title: `${0}-item`},
}

export default function ArrayEditingBreadcrumbsMenuButtonStory(): JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path>(['first-item'])

  return (
    <Flex align="center" justify="center" height="fill">
      <ArrayEditingBreadcrumbsMenuButton
        button={<button type="button">Click me</button>}
        onPathSelect={setSelectedPath}
        parentElement={document.body}
        selectedPath={selectedPath}
        items={[ITEM]}
      />
    </Flex>
  )
}
