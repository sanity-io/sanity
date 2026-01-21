import {Schema} from '@sanity/schema'
import {type Path} from '@sanity/types'
import {Flex} from '@sanity/ui'
import {useState} from 'react'

import {TreeEditingBreadcrumbsMenuButton} from '../components/breadcrumbs/TreeEditingBreadcrumbsMenuButton'
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

const ITEM: TreeEditingBreadcrumb = {
  path: ['first-item'],
  schemaType: schema.get('testDocument').fields[0].type,
  value: {_key: 'first-item', title: `${0}-item`},
  parentSchemaType: schema.get('testDocument'),
  children: [...Array(100).keys()].map((index) => ({
    path: [`${index}-item`],
    schemaType: schema.get('testDocument').fields[0].type,
    parentSchemaType: schema.get('testDocument'),
    value: {
      _key: `${index}-item`,
      title: `${index}-item`,
    },
  })),
}

export default function TreeEditingBreadcrumbsMenuButtonStory(): React.JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path>(['first-item'])

  return (
    <Flex align="center" justify="center" height="fill">
      <TreeEditingBreadcrumbsMenuButton
        button={<button type="button">Click me</button>}
        items={ITEM.children || []}
        onPathSelect={setSelectedPath}
        parentElement={document.body}
        selectedPath={selectedPath}
      />
    </Flex>
  )
}
