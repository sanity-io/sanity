import {describe, expect, test} from '@jest/globals'

import {type SearchableTreeEditingMenuItem} from '../components/search/types'
import {treeEditingSearch} from '../components/search/utils'

const NOOP_SCHEMA_TYPE = null as any

const ITEMS: SearchableTreeEditingMenuItem[] = [
  {
    path: ['path-1'],
    title: 'Item 1',
    parentSchemaType: NOOP_SCHEMA_TYPE,
    schemaType: NOOP_SCHEMA_TYPE,
    value: {_key: 'path-1', title: 'Item 1'},
  },
  {
    path: ['path-2'],
    title: 'Item 2',
    parentSchemaType: NOOP_SCHEMA_TYPE,
    schemaType: NOOP_SCHEMA_TYPE,
    value: {_key: 'path-2', title: 'Item 2'},
    children: [
      {
        path: ['path-2', 'child-1'],
        title: 'Child 1',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-2', title: 'Child 1'},
        children: [
          {
            path: ['path-2', 'child-1', 'grandchild-1'],
            title: 'Grandchild 1',
            parentSchemaType: NOOP_SCHEMA_TYPE,
            schemaType: NOOP_SCHEMA_TYPE,
            value: {_key: 'path-2', title: 'Grandchild 1'},
          },
          {
            path: ['path-2', 'child-1', 'grandchild-2'],
            title: 'Grandchild 2',
            parentSchemaType: NOOP_SCHEMA_TYPE,
            schemaType: NOOP_SCHEMA_TYPE,
            value: {_key: 'path-2', title: 'Grandchild 2'},
          },
        ],
      },
    ],
  },
  {
    path: ['path-3'],
    title: 'Item 3',
    parentSchemaType: NOOP_SCHEMA_TYPE,
    schemaType: NOOP_SCHEMA_TYPE,
    value: {_key: 'path-3', title: 'Item 3'},
  },
]

describe('tree-editing: search', () => {
  test('should return the correct result when searching for "Item 1"', () => {
    const result = treeEditingSearch(ITEMS, 'Item 1')
    const expected: SearchableTreeEditingMenuItem[] = [
      {
        path: ['path-1'],
        title: 'Item 1',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-1', title: 'Item 1'},
      },
    ]
    expect(result).toEqual(expected)
  })

  test('should return the correct result when searching for "Item"', () => {
    const result = treeEditingSearch(ITEMS, 'Item')
    const expected: SearchableTreeEditingMenuItem[] = [
      {
        path: ['path-1'],
        title: 'Item 1',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-1', title: 'Item 1'},
      },
      {
        path: ['path-2'],
        title: 'Item 2',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-2', title: 'Item 2'},
      },
      {
        path: ['path-3'],
        title: 'Item 3',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-3', title: 'Item 3'},
      },
    ]
    expect(result).toEqual(expected)
  })

  test('should return the correct result when searching for "Child"', () => {
    const result = treeEditingSearch(ITEMS, 'Child')
    const expected: SearchableTreeEditingMenuItem[] = [
      {
        path: ['path-2', 'child-1'],
        title: 'Child 1',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-2', title: 'Child 1'},
      },
      {
        path: ['path-2', 'child-1', 'grandchild-1'],
        title: 'Grandchild 1',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-2', title: 'Grandchild 1'},
      },
      {
        path: ['path-2', 'child-1', 'grandchild-2'],
        title: 'Grandchild 2',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-2', title: 'Grandchild 2'},
      },
    ]
    expect(result).toEqual(expected)
  })

  test('should return the correct result when searching for "Grandchild"', () => {
    const result = treeEditingSearch(ITEMS, 'Grandchild')
    const expected: SearchableTreeEditingMenuItem[] = [
      {
        path: ['path-2', 'child-1', 'grandchild-1'],
        title: 'Grandchild 1',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-2', title: 'Grandchild 1'},
      },
      {
        path: ['path-2', 'child-1', 'grandchild-2'],
        title: 'Grandchild 2',
        parentSchemaType: NOOP_SCHEMA_TYPE,
        schemaType: NOOP_SCHEMA_TYPE,
        value: {_key: 'path-2', title: 'Grandchild 2'},
      },
    ]
    expect(result).toEqual(expected)
  })

  test('should return an empty array when searching for "NO MATCH QUERY"', () => {
    const result = treeEditingSearch(ITEMS, 'NO MATCH QUERY')
    const expected: SearchableTreeEditingMenuItem[] = []
    expect(result).toEqual(expected)
  })
})
