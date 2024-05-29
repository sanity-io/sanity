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
  test('should return the correct result when searching', () => {
    // Case 1
    const result1 = treeEditingSearch(ITEMS, 'Item 1')

    const expected1: TreeEditingMenuItem[] = [
      {
        path: ['path-1'],
        title: 'Item 1',
      },
    ]

    // Case 2
    const result2 = treeEditingSearch(ITEMS, 'Item')

    const expected2: TreeEditingMenuItem[] = [
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

    // Case 3
    const result3 = treeEditingSearch(ITEMS, 'Child')

    const expected3: TreeEditingMenuItem[] = [
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

    // Case 4
    const result4 = treeEditingSearch(ITEMS, 'Grandchild')

    const expected4: TreeEditingMenuItem[] = [
      {
        path: ['path-2', 'child-1', 'grandchild-1'],
        title: 'Grandchild 1',
      },
      {
        path: ['path-2', 'child-1', 'grandchild-2'],
        title: 'Grandchild 2',
      },
    ]

    // Case 5
    const result5 = treeEditingSearch(ITEMS, 'NO MATCH QUERY')
    const expected5: TreeEditingMenuItem[] = []

    expect(result1).toEqual(expected1)
    expect(result2).toEqual(expected2)
    expect(result3).toEqual(expected3)
    expect(result4).toEqual(expected4)
    expect(result5).toEqual(expected5)
  })
})
