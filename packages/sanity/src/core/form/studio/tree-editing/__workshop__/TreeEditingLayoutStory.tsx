import {Schema} from '@sanity/schema'
import {type Path} from '@sanity/types'
import {Card, Code, Stack} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {TreeEditingLayout} from '../components/layout/TreeEditingLayout'
import {buildTreeEditingState} from '../utils/build-tree-editing-state/buildTreeEditingState'

const schema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'testDocument',
      title: 'Document',
      type: 'document',
      fields: [
        {
          type: 'array',
          name: 'myArrayOfObjects',
          title: 'My array of objects',
          of: [
            {
              type: 'object',
              name: 'myObject',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
                {
                  type: 'array',
                  name: 'nestedArray',
                  title: 'Nested array 1',
                  of: [
                    {
                      type: 'object',
                      name: 'nestedObject',
                      fields: [
                        {
                          type: 'string',
                          name: 'title',
                          title: 'Title',
                        },
                        {
                          type: 'array',
                          name: 'nestedArray',
                          title: 'Nested array 2',
                          of: [
                            {
                              type: 'object',
                              name: 'nestedObject',
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
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

const DOCUMENT_VALUE = {
  _id: 'test',
  _type: 'testDocument',
  myArrayOfObjects: [
    {
      _key: 'item-1',
      _type: 'myObject',
      title: 'Item 1',
      nestedArray: [
        {_key: 'nested-1-1', _type: 'nestedObject', title: 'Nested 1.1'},
        {_key: 'nested-1-2', _type: 'nestedObject', title: 'Nested 1.2'},
        {
          _key: 'nested-1-3',
          _type: 'nestedObject',
          title: 'Nested 1.3',

          nestedArray: [
            {
              _key: 'nested-1-3-1',
              _type: 'nestedObject',
              title: 'Nested 1.3.1',
            },
            {
              _key: 'nested-1-3-2',
              _type: 'nestedObject',
              title: 'Nested 1.3.2',
            },
          ],
        },
      ],
    },
    {_key: 'item-2', _type: 'myObject', title: 'Item 2'},
    {_key: 'item-3', _type: 'myObject', title: 'Item 3'},
    {
      _key: 'item-4',
      _type: 'myObject',
      title: 'Item 4',
      nestedArray: [
        {_key: 'nested-4-1', _type: 'nestedObject', title: 'Nested 4.1'},
        {_key: 'nested-4-2', _type: 'nestedObject', title: 'Nested 4.2'},
      ],
    },
  ],
}

export default function TreeEditingLayoutStory(): React.JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path>(['myArrayOfObjects', {_key: 'first-item'}])

  const state = useMemo(() => {
    return buildTreeEditingState({
      documentValue: DOCUMENT_VALUE,
      schemaType: schema.get('testDocument'),
      openPath: selectedPath,
    })
  }, [selectedPath])

  const handlePathSelect = useCallback((path: Path) => {
    setSelectedPath(path)
  }, [])

  return (
    <TreeEditingLayout
      breadcrumbs={state.breadcrumbs}
      items={state.menuItems}
      onPathSelect={handlePathSelect}
      selectedPath={selectedPath}
      title="Title"
    >
      <Stack space={2}>
        <Card padding={4} tone="transparent" radius={2}>
          <Code size={1} language="json">
            {JSON.stringify(state?.relativePath, null, 2)}
          </Code>
        </Card>
      </Stack>
    </TreeEditingLayout>
  )
}
