import {Schema} from '@sanity/schema'
import {Container} from '@sanity/ui'
import {useState} from 'react'
import {type Path} from 'sanity'

import {TreeEditingMenu} from '../components'
import {type TreeEditingMenuItem} from '../types'

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

function buildStructure(depth: number, start: number): TreeEditingMenuItem[] {
  function createItem(level: number): TreeEditingMenuItem {
    const path = Array.from({length: level}, (_, i) => `level-${i + 1 + start}`)
    const children = level < depth ? [createItem(level + 1)] : []
    const schemaType = schema.get('testDocument').fields[0].type
    const value = {_key: `level-${level + start}`, title: `Level ${level + start}`}

    return {path, children, schemaType, value}
  }

  return [createItem(1)]
}

const ITEMS: TreeEditingMenuItem[] = [
  ...buildStructure(5, 0),
  ...buildStructure(5, 1),
  ...buildStructure(0, 2),
  ...buildStructure(10, 3),
  ...buildStructure(5, 4),
]

export default function TreeEditingMenuStory(): JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path | null>(null)

  return (
    <Container width={0} padding={3} sizing="border">
      <TreeEditingMenu items={ITEMS} onPathSelect={setSelectedPath} selectedPath={selectedPath} />
    </Container>
  )
}
