import {type Path} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {validateRelativePathExists} from '../build-tree-editing-state/utils'

describe('validateRelativePathExists', () => {
  test('if the relative path is null, should return the relative path', () => {
    const relativePath = null
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      title: 'Test document',
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(relativePath)
  })

  test('if the relative path is an empty array, should return the relative path', () => {
    const relativePath: Path = []
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      title: 'Test document',
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(relativePath)
  })

  test('if the document value is undefined, should return the relative path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}]
    const documentValue = undefined
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items'])
  })

  test('if the parent value is not an array, should return the parent path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: 'not an array',
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items'])
  })

  test('if the item does not exist in the array, should return the parent path', () => {
    const relativePath: Path = ['items', {_key: 'nonexistent'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {_key: 'item1', title: 'Item 1'},
        {_key: 'item2', title: 'Item 2'},
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items'])
  })

  test('if the item exists in the array, should return the relative path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {_key: 'item1', title: 'Item 1'},
        {_key: 'item2', title: 'Item 2'},
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(relativePath)
  })

  test('if the path contains non-key segments, should skip them and continue validation', () => {
    const relativePath: Path = ['items', {_key: 'item1'}, 'title']
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {_key: 'item1', title: 'Item 1'},
        {_key: 'item2', title: 'Item 2'},
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(relativePath)
  })

  /** Deeply nested */

  test('if deeply nested item does not exist (last item in path), should return the parent path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}, 'nested', {_key: 'nonexistent'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {
          _key: 'item1',
          title: 'Item 1',
          nested: [
            {_key: 'nested1', title: 'Nested 1'},
            {_key: 'nested2', title: 'Nested 2'},
          ],
        },
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items', {_key: 'item1'}, 'nested'])
  })

  test('if deeply nested item exists (last item in path), should return the relative path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}, 'nested', {_key: 'nested1'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {
          _key: 'item1',
          title: 'Item 1',
          nested: [
            {_key: 'nested1', title: 'Nested 1'},
            {_key: 'nested2', title: 'Nested 2'},
          ],
        },
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(relativePath)
  })

  test('if intermediate array is not an array, should return the intermediate parent path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}, 'nested', {_key: 'nested1'}, 'title']
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {
          _key: 'item1',
          title: 'Item 1',
          nested: 'not an array', // This should cause the function to return parent path
        },
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items', {_key: 'item1'}, 'nested'])
  })

  test('if array item exists but has no _key, should return the parent path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {title: 'Item without key'}, // No _key property
        {_key: 'item2', title: 'Item 2'},
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items'])
  })

  test('if array item is null, should return the parent path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        null, // Null item
        {_key: 'item2', title: 'Item 2'},
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items'])
  })

  test('if path has multiple key segments and first one does not exist, should return parent path', () => {
    const relativePath: Path = ['items', {_key: 'nonexistent'}, 'nested', {_key: 'nested1'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {
          _key: 'item1',
          title: 'Item 1',
          nested: [{_key: 'nested1', title: 'Nested 1'}],
        },
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items']) // Should return the parent path of the first non-existent item
  })

  test('if path has multiple key segments and middle one does not exist, should return parent path', () => {
    const relativePath: Path = [
      'items',
      {_key: 'item1'},
      'nested',
      {_key: 'nonexistent'},
      'title',
      {_key: 'nested1'},
    ]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [
        {
          _key: 'item1',
          title: 'Item 1',
          nested: [{_key: 'nested1', title: 'Nested 1'}],
        },
      ],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items', {_key: 'item1'}, 'nested']) // Should return the parent path
  })

  test('if path has multiple key segments and none of them exist, should return parent path', () => {
    const relativePath: Path = ['items', {_key: 'nonexistent'}, 'nested', {_key: 'nonexistent'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(['items'])
  })

  test('if path has multiple key segments and all of them exist, should return the relative path', () => {
    const relativePath: Path = ['items', {_key: 'item1'}, 'nested', {_key: 'nested1'}]
    const documentValue = {
      _id: '123',
      _type: 'testDocument',
      items: [{_key: 'item1', title: 'Item 1', nested: [{_key: 'nested1', title: 'Nested 1'}]}],
    }
    const result = validateRelativePathExists(relativePath, documentValue)
    expect(result).toEqual(relativePath)
  })
})
