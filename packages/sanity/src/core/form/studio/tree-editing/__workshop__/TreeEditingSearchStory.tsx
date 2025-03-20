import {Schema} from '@sanity/schema'
import {Container, Flex} from '@sanity/ui'
import {useMemo} from 'react'

import {TreeEditingSearch} from '../components/search/TreeEditingSearch'
import {
  buildTreeEditingState,
  type TreeEditingState,
} from '../utils/build-tree-editing-state/buildTreeEditingState'

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

export default function TreeEditingSearchStory() {
  const {menuItems} = useMemo((): TreeEditingState => {
    return buildTreeEditingState({
      schemaType: schema.get('testDocument'),
      documentValue: DOCUMENT_VALUE,
      openPath: ['myArrayOfObjects', {_key: 'item-1'}],
    })
  }, [])

  return (
    <Flex align="center" height="fill" justify="center">
      <Container width={0}>
        <TreeEditingSearch items={menuItems} onPathSelect={noop} />
      </Container>
    </Flex>
  )
}
