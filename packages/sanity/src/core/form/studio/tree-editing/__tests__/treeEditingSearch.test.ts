import {describe, expect, test} from '@jest/globals'

import {treeEditingSearch} from '../components/search/utils'
import {type TreeEditingMenuItem} from '../types'

const ITEMS: TreeEditingMenuItem[] = [
  {
    path: ['path-1'],
    title: 'Item 1',
  },
  {
    path: ['path-2'],
    title: 'Item 2',
    children: [
      {
        path: ['path-2', 'child-1'],
        title: 'Child 1',
        children: [
          {
            path: ['path-2', 'child-1', 'grandchild-1'],
            title: 'Grandchild 1',
          },
          {
            path: ['path-2', 'child-1', 'grandchild-2'],
            title: 'Grandchild 2',
          },
        ],
      },
    ],
  },
  {
    path: ['path-3'],
    title: 'Item 3',
  },
]

describe('tree-editing: search', () => {
  test('should return the correct result when searching for "Item 1"', () => {
    const result = treeEditingSearch(ITEMS, 'Item 1')
    const expected: TreeEditingMenuItem[] = [
      {
        path: ['path-1'],
        title: 'Item 1',
      },
    ]
    expect(result).toEqual(expected)
  })

  test('should return the correct result when searching for "Item"', () => {
    const result = treeEditingSearch(ITEMS, 'Item')
    const expected: TreeEditingMenuItem[] = [
      {
        path: ['path-1'],
        title: 'Item 1',
      },
      {
        path: ['path-2'],
        title: 'Item 2',
      },
      {
        path: ['path-3'],
        title: 'Item 3',
      },
    ]
    expect(result).toEqual(expected)
  })

  test('should return the correct result when searching for "Child"', () => {
    const result = treeEditingSearch(ITEMS, 'Child')
    const expected: TreeEditingMenuItem[] = [
      {
        path: ['path-2', 'child-1'],
        title: 'Child 1',
      },
      {
        path: ['path-2', 'child-1', 'grandchild-1'],
        title: 'Grandchild 1',
      },
      {
        path: ['path-2', 'child-1', 'grandchild-2'],
        title: 'Grandchild 2',
      },
    ]
    expect(result).toEqual(expected)
  })

  test('should return the correct result when searching for "Grandchild"', () => {
    const result = treeEditingSearch(ITEMS, 'Grandchild')
    const expected: TreeEditingMenuItem[] = [
      {
        path: ['path-2', 'child-1', 'grandchild-1'],
        title: 'Grandchild 1',
      },
      {
        path: ['path-2', 'child-1', 'grandchild-2'],
        title: 'Grandchild 2',
      },
    ]
    expect(result).toEqual(expected)
  })

  test('should return an empty array when searching for "NO MATCH QUERY"', () => {
    const result = treeEditingSearch(ITEMS, 'NO MATCH QUERY')
    const expected: TreeEditingMenuItem[] = []
    expect(result).toEqual(expected)
  })
})
