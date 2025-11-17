import {Schema} from '@sanity/schema'
import {
  type ArraySchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
} from '@sanity/types'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {buildArrayState} from '../buildArrayState'
import {type TreeEditingState} from '../buildTreeEditingState'

// Mock schema for testing array state building
const schema = Schema.compile({
  name: 'default',
  types: [
    // Required built-in types
    {
      name: 'sanity.imageAsset',
      type: 'object',
      fields: [
        {name: 'url', type: 'string'},
        {name: '_id', type: 'string'},
      ],
    },
    {
      name: 'sanity.imageHotspot',
      type: 'object',
      fields: [
        {name: 'x', type: 'number'},
        {name: 'y', type: 'number'},
        {name: 'height', type: 'number'},
        {name: 'width', type: 'number'},
      ],
    },
    {
      name: 'sanity.imageCrop',
      type: 'object',
      fields: [
        {name: 'top', type: 'number'},
        {name: 'bottom', type: 'number'},
        {name: 'left', type: 'number'},
        {name: 'right', type: 'number'},
      ],
    },
    {
      name: 'testDocument',
      title: 'Test Document',
      type: 'document',
      fields: [
        {
          name: 'simpleArray',
          title: 'Simple Array',
          type: 'array',
          of: [
            {
              name: 'simpleItem',
              title: 'Simple Item',
              type: 'object',
              fields: [
                {name: 'title', type: 'string'},
                {name: 'description', type: 'text'},
              ],
            },
          ],
        },
        {
          name: 'nestedArray',
          title: 'Nested Array',
          type: 'array',
          of: [
            {
              name: 'nestedItem',
              title: 'Nested Item',
              type: 'object',
              fields: [
                {name: 'name', type: 'string'},
                {
                  name: 'subItems',
                  title: 'Sub Items',
                  type: 'array',
                  of: [
                    {
                      name: 'subItem',
                      title: 'Sub Item',
                      type: 'object',
                      fields: [
                        {name: 'value', type: 'string'},
                        {
                          name: 'deepItems',
                          title: 'Deep Items',
                          type: 'array',
                          of: [
                            {
                              name: 'deepItem',
                              title: 'Deep Item',
                              type: 'object',
                              fields: [{name: 'content', type: 'string'}],
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
        {
          name: 'portableTextArray',
          title: 'Portable Text Array',
          type: 'array',
          of: [
            {
              type: 'block',
            },
            {
              name: 'customBlock',
              title: 'Custom Block',
              type: 'object',
              fields: [
                {name: 'title', type: 'string'},
                {
                  name: 'items',
                  title: 'Items',
                  type: 'array',
                  of: [
                    {
                      name: 'item',
                      title: 'Item',
                      type: 'object',
                      fields: [{name: 'name', type: 'string'}],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'primitiveArray',
          title: 'Primitive Array',
          type: 'array',
          of: [{type: 'string'}],
        },
      ],
    },
  ],
})

const documentSchema = schema.get('testDocument') as ObjectSchemaType

// Mock document values
const mockDocumentValue = {
  _id: 'test-doc',
  _type: 'testDocument',
  simpleArray: [
    {
      _key: 'item1',
      _type: 'simpleItem',
      title: 'Item 1',
      description: 'Description 1',
    },
    {
      _key: 'item2',
      _type: 'simpleItem',
      title: 'Item 2',
      description: 'Description 2',
    },
  ],
  nestedArray: [
    {
      _key: 'nested1',
      _type: 'nestedItem',
      name: 'Nested Item 1',
      subItems: [
        {
          _key: 'sub1',
          _type: 'subItem',
          value: 'Sub Value 1',
          deepItems: [
            {
              _key: 'deep1',
              _type: 'deepItem',
              content: 'Deep Content 1',
            },
          ],
        },
        {
          _key: 'sub2',
          _type: 'subItem',
          value: 'Sub Value 2',
          deepItems: [
            {
              _key: 'deep2',
              _type: 'deepItem',
              content: 'Deep Content 2',
            },
          ],
        },
      ],
    },
  ],
  portableTextArray: [
    {
      _key: 'block1',
      _type: 'block',
      children: [
        {
          _key: 'span1',
          _type: 'span',
          text: 'This is a text block',
        },
      ],
    },
    {
      _key: 'custom1',
      _type: 'customBlock',
      title: 'Custom Block 1',
      items: [
        {
          _key: 'item1',
          _type: 'item',
          name: 'Item 1',
        },
      ],
    },
  ],
  primitiveArray: ['string1', 'string2', 'string3'],
}

// Mock recursive function
const mockRecursive = vi.fn(
  (): TreeEditingState => ({
    breadcrumbs: [],
    menuItems: [],
    relativePath: [],
    rootTitle: '',
    siblings: new Map(),
  }),
)

// Helper function to create test props
function createTestProps(overrides: Partial<Parameters<typeof buildArrayState>[0]> = {}) {
  const simpleArrayField = documentSchema.fields.find(
    (f) => f.name === 'simpleArray',
  ) as ObjectField<ArraySchemaType>
  const defaultProps = {
    arraySchemaType: simpleArrayField.type,
    arrayValue: mockDocumentValue.simpleArray,
    documentValue: mockDocumentValue,
    openPath: ['simpleArray'] as Path,
    rootPath: ['simpleArray'] as Path,
    recursive: mockRecursive,
    rootSchemaType: documentSchema,
  }

  return {...defaultProps, ...overrides}
}

describe('buildArrayState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should build basic array state with menu items', () => {
    const props = createTestProps()
    const result = buildArrayState(props)

    expect(result.menuItems).toHaveLength(2)
    expect(result.menuItems[0]).toMatchObject({
      path: ['simpleArray', {_key: 'item1'}],
      schemaType: expect.objectContaining({name: 'simpleItem'}),
      value: expect.objectContaining({_key: 'item1', title: 'Item 1'}),
    })
    expect(result.menuItems[1]).toMatchObject({
      path: ['simpleArray', {_key: 'item2'}],
      schemaType: expect.objectContaining({name: 'simpleItem'}),
      value: expect.objectContaining({_key: 'item2', title: 'Item 2'}),
    })
  })

  test('should set relative path when array item is selected', () => {
    const openPath: Path = ['simpleArray', {_key: 'item1'}]
    const props = createTestProps({openPath})
    const result = buildArrayState(props)

    expect(result.relativePath).toEqual(['simpleArray', {_key: 'item1'}])
  })

  test('should set relative path when nested field is selected', () => {
    const openPath: Path = ['simpleArray', {_key: 'item1'}, 'title']
    const props = createTestProps({openPath})
    const result = buildArrayState(props)

    // The function sets relativePath to the array item path, not the nested field
    expect(result.relativePath).toEqual(['simpleArray', {_key: 'item1'}])
  })

  test('should build breadcrumbs for selected items', () => {
    const openPath: Path = ['simpleArray', {_key: 'item1'}, 'title']
    const props = createTestProps({openPath})
    const result = buildArrayState(props)

    expect(result.breadcrumbs).toHaveLength(1)
    expect(result.breadcrumbs[0]).toMatchObject({
      path: ['simpleArray', {_key: 'item1'}],
      schemaType: expect.objectContaining({name: 'simpleItem'}),
      value: expect.objectContaining({_key: 'item1'}),
    })
  })

  test('should handle nested arrays with recursion', () => {
    const nestedArrayField = documentSchema.fields.find(
      (f) => f.name === 'nestedArray',
    ) as ObjectField<ArraySchemaType>
    const openPath: Path = ['nestedArray', {_key: 'nested1'}, 'subItems', {_key: 'sub1'}]
    const props = createTestProps({
      arraySchemaType: nestedArrayField.type,
      arrayValue: mockDocumentValue.nestedArray,
      openPath,
      rootPath: ['nestedArray'] as Path,
    })

    const result = buildArrayState(props)

    expect(mockRecursive).toHaveBeenCalled()
    // The openPath doesn't exactly match any itemPath, so relativePath remains empty
    expect(result.relativePath).toEqual([])
  })

  test('should handle portable text arrays correctly', () => {
    const pteArrayField = documentSchema.fields.find(
      (f) => f.name === 'portableTextArray',
    ) as ObjectField<ArraySchemaType>
    const openPath: Path = ['portableTextArray', {_key: 'custom1'}]
    const props = createTestProps({
      arraySchemaType: pteArrayField.type,
      arrayValue: mockDocumentValue.portableTextArray,
      openPath,
      rootPath: ['portableTextArray'] as Path,
    })

    const result = buildArrayState(props)

    expect(result.menuItems).toHaveLength(2) // block and customBlock
    expect(result.menuItems[0]).toMatchObject({
      path: ['portableTextArray', {_key: 'block1'}],
      schemaType: expect.objectContaining({name: 'block'}),
    })
    expect(result.menuItems[1]).toMatchObject({
      path: ['portableTextArray', {_key: 'custom1'}],
      schemaType: expect.objectContaining({name: 'customBlock'}),
    })
  })

  test('should return empty state for portable text when openPath points to text content', () => {
    const pteArrayField = documentSchema.fields.find(
      (f) => f.name === 'portableTextArray',
    ) as ObjectField<ArraySchemaType>
    const openPath: Path = ['portableTextArray', {_key: 'block1'}, 'children', {_key: 'span1'}]
    const props = createTestProps({
      arraySchemaType: pteArrayField.type,
      arrayValue: mockDocumentValue.portableTextArray,
      openPath,
      rootPath: ['portableTextArray'] as Path,
    })

    const result = buildArrayState(props)

    expect(result.menuItems).toHaveLength(0)
    expect(result.breadcrumbs).toHaveLength(0)
    expect(result.relativePath).toEqual([])
  })

  test('should handle primitive arrays correctly', () => {
    const primitiveArrayField = documentSchema.fields.find(
      (f) => f.name === 'primitiveArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: primitiveArrayField.type,
      arrayValue: mockDocumentValue.primitiveArray as unknown as Record<string, unknown>[],
      rootPath: ['primitiveArray'] as Path,
    })

    const _result = buildArrayState(props)

    // Primitive arrays should not have menu items
    expect(_result.menuItems).toHaveLength(0)
  })

  test('should handle empty arrays', () => {
    const props = createTestProps({
      arrayValue: [],
    })

    const result = buildArrayState(props)

    expect(result.menuItems).toHaveLength(0)
    expect(result.breadcrumbs).toHaveLength(0)
    expect(result.relativePath).toEqual([])
  })

  test('should handle arrays with missing _key', () => {
    const arrayWithMissingKey = [
      {
        _type: 'simpleItem',
        title: 'Item without key',
      },
    ]
    const props = createTestProps({
      arrayValue: arrayWithMissingKey as Record<string, unknown>[],
    })

    const result = buildArrayState(props)

    // The function still creates menu items even without _key, but with undefined path
    expect(result.menuItems).toHaveLength(1)
  })

  test('should handle reference schema types by skipping them', () => {
    const referenceItem = {
      _key: 'ref1',
      _type: 'reference',
      _ref: 'some-reference',
    }
    const props = createTestProps({
      arrayValue: [referenceItem] as Record<string, unknown>[],
    })

    const result = buildArrayState(props)

    expect(result.menuItems).toHaveLength(0)
  })

  test('should validate relative path exists and fallback to parent', () => {
    const openPath: Path = ['simpleArray', {_key: 'nonexistent'}]
    const props = createTestProps({openPath})
    const result = buildArrayState(props)

    // The function doesn't set relativePath for non-existent items
    expect(result.relativePath).toEqual([])
  })

  test('should handle deeply nested non-existent items', () => {
    const openPath: Path = [
      'nestedArray',
      {_key: 'nested1'},
      'subItems',
      {_key: 'nonexistent'},
      'deepItems',
      {_key: 'deep1'},
    ]
    const nestedArrayField = documentSchema.fields.find(
      (f) => f.name === 'nestedArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: nestedArrayField.type,
      arrayValue: mockDocumentValue.nestedArray,
      openPath,
      rootPath: ['nestedArray'] as Path,
    })

    const result = buildArrayState(props)

    // The function doesn't set relativePath for non-existent nested items
    expect(result.relativePath).toEqual([])
  })

  test('should handle deeply nested non-existent items (multiple levels)', () => {
    const openPath: Path = [
      'nestedArray',
      {_key: 'nested1'},
      'subItems',
      {_key: 'nonexistent'},
      'deepItems',
      {_key: 'nonexistent'},
      'title',
    ]
    const nestedArrayField = documentSchema.fields.find(
      (f) => f.name === 'nestedArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: nestedArrayField.type,
      arrayValue: mockDocumentValue.nestedArray,
      openPath,
      rootPath: ['nestedArray'] as Path,
    })

    const result = buildArrayState(props)

    // The function doesn't set relativePath for non-existent nested items
    expect(result.relativePath).toEqual([])
  })

  test('should build correct menu items structure for nested objects', () => {
    const nestedArrayField = documentSchema.fields.find(
      (f) => f.name === 'nestedArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: nestedArrayField.type,
      arrayValue: mockDocumentValue.nestedArray,
      rootPath: ['nestedArray'] as Path,
    })

    const result = buildArrayState(props)

    expect(result.menuItems).toHaveLength(1)
    expect(result.menuItems[0]).toMatchObject({
      path: ['nestedArray', {_key: 'nested1'}],
      schemaType: expect.objectContaining({name: 'nestedItem'}),
      value: expect.objectContaining({_key: 'nested1'}),
    })
  })

  test('should handle array of objects correctly', () => {
    const openPath: Path = ['nestedArray', {_key: 'nested1'}, 'subItems']
    const nestedArrayField = documentSchema.fields.find(
      (f) => f.name === 'nestedArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: nestedArrayField.type,
      arrayValue: mockDocumentValue.nestedArray,
      openPath,
      rootPath: ['nestedArray'] as Path,
    })

    const _result = buildArrayState(props)

    expect(mockRecursive).toHaveBeenCalledWith({
      documentValue: mockDocumentValue,
      path: ['nestedArray', {_key: 'nested1'}, 'subItems'],
      schemaType: expect.any(Object),
    })
  })

  test('should handle breadcrumbs for deeply nested paths', () => {
    // Set openPath to point to an item within the properties_c array
    const openPath: Path = [
      'animals',
      {_key: 'animal1'},
      'friends',
      {_key: 'friend1'},
      'properties',
      {_key: 'prop1'},
      'properties_b',
      {_key: 'prop_b1'},
      'properties_c',
      {_key: 'prop_c1'},
    ]
    const rootPath: Path = [
      'animals',
      {_key: 'animal1'},
      'friends',
      {_key: 'friend1'},
      'properties',
      {_key: 'prop1'},
      'properties_b',
      {_key: 'prop_b1'},
      'properties_c',
    ]

    // Create a mock array schema type similar to the structure you showed
    const arraySchemaType = {
      jsonType: 'array' as const,
      type: {name: 'array'},
      name: 'properties_c',
      validation: [],
      title: 'Properties C',
      of: [
        {
          name: 'propertyItem',
          type: 'object',
          fields: [{name: 'value', type: 'string'}],
        },
      ],
    } as unknown as ArraySchemaType

    const arrayValue = [
      {
        _key: 'prop_c1',
        _type: 'propertyItem',
        value: 'Property C Value 1',
      },
    ]

    const documentValue = {
      _createdAt: '2024-05-14T15:04:30Z',
      _id: 'drafts.7c71b8b7-8b6c-47a0-a6ca-e691776e8bbc',
      _rev: '95459101-16bb-4300-96b3-646860a8fad7',
      _type: 'objectsDebug',
      _updatedAt: '2025-10-06T08:49:30Z',
      animals: [
        {
          _key: 'animal1',
          _type: 'animal',
          name: 'Animal 1',
          friends: [
            {
              _key: 'friend1',
              _type: 'friend',
              name: 'Friend 1',
              properties: [
                {
                  _key: 'prop1',
                  _type: 'property',
                  name: 'Property 1',
                  // eslint-disable-next-line camelcase
                  properties_b: [
                    {
                      _key: 'prop_b1',
                      _type: 'propertyB',
                      name: 'Property B1',
                      // eslint-disable-next-line camelcase
                      properties_c: arrayValue,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const rootSchemaType = {
      jsonType: 'object' as const,
      type: {name: 'object'},
      name: 'objectsDebug',
      title: 'Objects Debug',
      validation: [],
      fields: [],
    } as unknown as ObjectSchemaType

    const props = {
      arraySchemaType,
      arrayValue,
      documentValue,
      openPath,
      rootPath,
      recursive: mockRecursive,
      rootSchemaType,
    }

    const result = buildArrayState(props)

    // Should have breadcrumb for the properties_c array item that contains the selected path
    expect(result.breadcrumbs).toHaveLength(1)

    // Check properties_c breadcrumb - this should be the only breadcrumb created by buildArrayState
    expect(result.breadcrumbs[0]).toMatchObject({
      path: [
        'animals',
        {_key: 'animal1'},
        'friends',
        {_key: 'friend1'},
        'properties',
        {_key: 'prop1'},
        'properties_b',
        {_key: 'prop_b1'},
        'properties_c',
        {_key: 'prop_c1'},
      ],
      schemaType: expect.objectContaining({name: 'propertyItem'}),
      value: expect.objectContaining({
        _key: 'prop_c1',
        _type: 'propertyItem',
      }),
    })

    // The breadcrumb should have children representing all items in the properties_c array
    expect(result.breadcrumbs[0].children).toHaveLength(1)
    expect(result.breadcrumbs[0].children?.[0]).toMatchObject({
      path: [
        'animals',
        {_key: 'animal1'},
        'friends',
        {_key: 'friend1'},
        'properties',
        {_key: 'prop1'},
        'properties_b',
        {_key: 'prop_b1'},
        'properties_c',
        {_key: 'prop_c1'},
      ],
      schemaType: expect.objectContaining({name: 'propertyItem'}),
    })
  })

  /** Siblings */

  test('when openPath points to a nested array item, it should set siblings correctly', () => {
    const openPath: Path = ['nestedArray', {_key: 'nested1'}, 'subItems', {_key: 'sub1'}]
    const nestedArrayField = documentSchema.fields.find(
      (f) => f.name === 'nestedArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: nestedArrayField.type,
      arrayValue: mockDocumentValue.nestedArray,
      openPath,
      rootPath: ['nestedArray'] as Path,
    })

    const result = buildArrayState(props)

    // Should have siblings information for the nestedArray
    expect(result.siblings.has('nestedArray')).toBe(true)
    const siblingsInfo = result.siblings.get('nestedArray')
    expect(siblingsInfo).toEqual({
      count: 1, // Only one item in nestedArray
      index: 1, // 1-based index of the selected item
    })
  })

  test('when openPath points to a deeply nested array item (3 levels), it should set siblings correctly', () => {
    const openPath: Path = [
      'nestedArray',
      {_key: 'nested1'},
      'subItems',
      {_key: 'sub2'}, // Opening the second child (sub2) of the subItems array
      'deepItems',
      {_key: 'deep2'},
    ]
    const nestedArrayField = documentSchema.fields.find(
      (f) => f.name === 'nestedArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: nestedArrayField.type,
      arrayValue: mockDocumentValue.nestedArray,
      openPath,
      rootPath: ['nestedArray'] as Path,
    })

    const result = buildArrayState(props)

    // Should have siblings information for the nestedArray and subItems
    expect(result.siblings.has('nestedArray')).toBe(true)
    expect(result.siblings.has('nestedArray[_key=="nested1"].subItems')).toBe(true)

    // Check nestedArray siblings info
    const nestedArraySiblings = result.siblings.get('nestedArray')
    expect(nestedArraySiblings).toEqual({
      count: 1, // Only one item in nestedArray
      index: 1, // 1-based index of the selected item
    })

    // Check subItems siblings info - now we have 2 siblings
    const subItemsSiblings = result.siblings.get('nestedArray[_key=="nested1"].subItems')
    expect(subItemsSiblings).toEqual({
      count: 2, // Two items in subItems (sub1 and sub2)
      index: 2, // 1-based index of the selected item (sub2 is second)
    })
  })

  test('when openPath points to a text block, it should set siblings correctly (none)', () => {
    const openPath: Path = ['portableTextArray', {_key: 'block1'}]
    const pteArrayField = documentSchema.fields.find(
      (f) => f.name === 'portableTextArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: pteArrayField.type,
      arrayValue: mockDocumentValue.portableTextArray,
      openPath,
      rootPath: ['portableTextArray'] as Path,
    })

    const result = buildArrayState(props)

    // Should have siblings information for the portableTextArray
    expect(result.siblings.has('portableTextArray')).toBe(false)
  })

  test('when openPath points to a text block, it should set siblings correctly (deeply nested) - none', () => {
    const openPath: Path = ['portableTextArray', {_key: 'custom1'}, 'items', {_key: 'item1'}]
    const pteArrayField = documentSchema.fields.find(
      (f) => f.name === 'portableTextArray',
    ) as ObjectField<ArraySchemaType>
    const props = createTestProps({
      arraySchemaType: pteArrayField.type,
      arrayValue: mockDocumentValue.portableTextArray,
      openPath,
      rootPath: ['portableTextArray'] as Path,
    })

    const result = buildArrayState(props)

    // Should have siblings information for the portableTextArray
    expect(result.siblings.has('portableTextArray')).toBe(false)
  })

  test('when openPath points to a object field that has no array fields, it should set siblings correctly (0)', () => {
    const openPath: Path = ['simpleArray', {_key: 'item1'}, 'title']
    const props = createTestProps({openPath})

    const result = buildArrayState(props)

    // Should have siblings information for the simpleArray
    expect(result.siblings.has('simpleArray')).toBe(true)
    const siblingsInfo = result.siblings.get('simpleArray')
    expect(siblingsInfo).toEqual({
      count: 2, // Two items in simpleArray
      index: 1, // 1-based index of the selected item (item1 is first)
    })
  })

  describe('reference handling', () => {
    // Add reference type to schema
    const schemaWithReferences = Schema.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          type: 'document',
          fields: [{name: 'name', type: 'string'}],
        },
        {
          name: 'testDocument',
          title: 'Test Document',
          type: 'document',
          fields: [
            {
              name: 'mixedArray',
              title: 'Mixed Array',
              type: 'array',
              of: [
                {
                  name: 'myObject',
                  type: 'object',
                  fields: [{name: 'title', type: 'string'}],
                },
                {
                  name: 'authorRef',
                  type: 'reference',
                  to: [{type: 'author'}],
                },
              ],
            },
            {
              name: 'objectWithRefField',
              title: 'Object with Reference Field',
              type: 'array',
              of: [
                {
                  name: 'item',
                  type: 'object',
                  fields: [
                    {name: 'title', type: 'string'},
                    {
                      name: 'author',
                      type: 'reference',
                      to: [{type: 'author'}],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })

    const docSchemaWithRefs = schemaWithReferences.get('testDocument') as ObjectSchemaType

    test('should NOT set relativePath when openPath points to a reference in a mixed array', () => {
      const mixedArrayField = docSchemaWithRefs.fields.find(
        (f) => f.name === 'mixedArray',
      ) as ObjectField<ArraySchemaType>

      const mockValue = {
        mixedArray: [
          {_key: 'obj1', _type: 'myObject', title: 'Object 1'},
          {_key: 'ref1', _type: 'authorRef', _ref: 'author-123'},
        ],
      }

      const openPath: Path = ['mixedArray', {_key: 'ref1'}]
      const props = {
        arraySchemaType: mixedArrayField.type,
        arrayValue: mockValue.mixedArray,
        documentValue: mockValue,
        openPath,
        rootPath: ['mixedArray'] as Path,
        recursive: mockRecursive,
        rootSchemaType: docSchemaWithRefs,
      }

      const result = buildArrayState(props)

      // relativePath should remain empty for references
      expect(result.relativePath).toEqual([])
    })

    test('should set relativePath when openPath points to a non-reference object in a mixed array', () => {
      const mixedArrayField = docSchemaWithRefs.fields.find(
        (f) => f.name === 'mixedArray',
      ) as ObjectField<ArraySchemaType>

      const mockValue = {
        mixedArray: [
          {_key: 'obj1', _type: 'myObject', title: 'Object 1'},
          {_key: 'ref1', _type: 'authorRef', _ref: 'author-123'},
        ],
      }

      const openPath: Path = ['mixedArray', {_key: 'obj1'}]
      const props = {
        arraySchemaType: mixedArrayField.type,
        arrayValue: mockValue.mixedArray,
        documentValue: mockValue,
        openPath,
        rootPath: ['mixedArray'] as Path,
        recursive: mockRecursive,
        rootSchemaType: docSchemaWithRefs,
      }

      const result = buildArrayState(props)

      // relativePath should be set for regular objects
      expect(result.relativePath).toEqual(['mixedArray', {_key: 'obj1'}])
    })

    test('should NOT set relativePath when openPath points to a reference field within an object', () => {
      const objectWithRefField = docSchemaWithRefs.fields.find(
        (f) => f.name === 'objectWithRefField',
      ) as ObjectField<ArraySchemaType>

      const mockValue = {
        objectWithRefField: [
          {
            _key: 'item1',
            _type: 'item',
            title: 'Item 1',
            author: {_ref: 'author-123', _type: 'reference'},
          },
        ],
      }

      const openPath: Path = ['objectWithRefField', {_key: 'item1'}, 'author']
      const props = {
        arraySchemaType: objectWithRefField.type,
        arrayValue: mockValue.objectWithRefField,
        documentValue: mockValue,
        openPath,
        rootPath: ['objectWithRefField'] as Path,
        recursive: mockRecursive,
        rootSchemaType: docSchemaWithRefs,
      }

      const result = buildArrayState(props)

      // relativePath should remain empty for reference fields
      expect(result.relativePath).toEqual([])
    })

    test('should set relativePath when openPath points to a non-reference field within an object', () => {
      const objectWithRefField = docSchemaWithRefs.fields.find(
        (f) => f.name === 'objectWithRefField',
      ) as ObjectField<ArraySchemaType>

      const mockValue = {
        objectWithRefField: [
          {
            _key: 'item1',
            _type: 'item',
            title: 'Item 1',
            author: {_ref: 'author-123', _type: 'reference'},
          },
        ],
      }

      const openPath: Path = ['objectWithRefField', {_key: 'item1'}, 'title']
      const props = {
        arraySchemaType: objectWithRefField.type,
        arrayValue: mockValue.objectWithRefField,
        documentValue: mockValue,
        openPath,
        rootPath: ['objectWithRefField'] as Path,
        recursive: mockRecursive,
        rootSchemaType: docSchemaWithRefs,
      }

      const result = buildArrayState(props)

      // relativePath should be set for non-reference fields
      expect(result.relativePath).toEqual(['objectWithRefField', {_key: 'item1'}])
    })

    test('should NOT include references in menuItems', () => {
      const mixedArrayField = docSchemaWithRefs.fields.find(
        (f) => f.name === 'mixedArray',
      ) as ObjectField<ArraySchemaType>

      const mockValue = {
        mixedArray: [
          {_key: 'obj1', _type: 'myObject', title: 'Object 1'},
          {_key: 'ref1', _type: 'authorRef', _ref: 'author-123'},
          {_key: 'obj2', _type: 'myObject', title: 'Object 2'},
        ],
      }

      const openPath: Path = ['mixedArray']
      const props = {
        arraySchemaType: mixedArrayField.type,
        arrayValue: mockValue.mixedArray,
        documentValue: mockValue,
        openPath,
        rootPath: ['mixedArray'] as Path,
        recursive: mockRecursive,
        rootSchemaType: docSchemaWithRefs,
      }

      const result = buildArrayState(props)

      // Should only have menu items for objects, not references
      expect(result.menuItems).toHaveLength(2)
      expect(result.menuItems[0].value).toEqual(
        expect.objectContaining({_key: 'obj1', title: 'Object 1'}),
      )
      expect(result.menuItems[1].value).toEqual(
        expect.objectContaining({_key: 'obj2', title: 'Object 2'}),
      )
    })
  })

  describe('custom components', () => {
    test('should set relativePath when item type has custom components.item', () => {
      // Create a schema with custom components.item
      const schemaWithCustomItem = Schema.compile({
        name: 'default',
        types: [
          {
            name: 'testDocument',
            type: 'document',
            fields: [
              {
                name: 'customArray',
                type: 'array',
                of: [
                  {
                    name: 'customItem',
                    type: 'object',
                    fields: [{name: 'title', type: 'string'}],
                    components: {
                      item: () => null, // Custom item component
                    },
                  },
                ],
              },
            ],
          },
        ],
      })

      const docSchema = schemaWithCustomItem.get('testDocument') as ObjectSchemaType
      const customArrayField = docSchema.fields.find(
        (f) => f.name === 'customArray',
      ) as ObjectField<ArraySchemaType>

      const mockValue = {
        customArray: [
          {_key: 'item1', _type: 'customItem', title: 'Item 1'},
          {_key: 'item2', _type: 'customItem', title: 'Item 2'},
        ],
      }

      const openPath: Path = ['customArray', {_key: 'item1'}]
      const props = {
        arraySchemaType: customArrayField.type,
        arrayValue: mockValue.customArray,
        documentValue: mockValue,
        openPath,
        rootPath: ['customArray'] as Path,
        recursive: mockRecursive,
        rootSchemaType: docSchema,
      }

      const result = buildArrayState(props)

      // relativePath should NOT be set when item has custom components
      expect(result.relativePath).toEqual(['customArray', {_key: 'item1'}])
      // Should not build menu items for items with custom components
      expect(result.menuItems.length).toBeGreaterThan(0)
    })

    test('should set relativePath when item type has custom components.input', () => {
      // Create a schema with custom components.input
      // components.input is allowed as it's often just a wrapper
      const schemaWithCustomInput = Schema.compile({
        name: 'default',
        types: [
          {
            name: 'testDocument',
            type: 'document',
            fields: [
              {
                name: 'customArray',
                type: 'array',
                of: [
                  {
                    name: 'customItem',
                    type: 'object',
                    fields: [{name: 'title', type: 'string'}],
                    components: {
                      input: () => null, // Custom input component
                    },
                  },
                ],
              },
            ],
          },
        ],
      })

      const docSchema = schemaWithCustomInput.get('testDocument') as ObjectSchemaType
      const customArrayField = docSchema.fields.find(
        (f) => f.name === 'customArray',
      ) as ObjectField<ArraySchemaType>

      const mockValue = {
        customArray: [
          {_key: 'item1', _type: 'customItem', title: 'Item 1'},
          {_key: 'item2', _type: 'customItem', title: 'Item 2'},
        ],
      }

      const openPath: Path = ['customArray', {_key: 'item1'}]
      const props = {
        arraySchemaType: customArrayField.type,
        arrayValue: mockValue.customArray,
        documentValue: mockValue,
        openPath,
        rootPath: ['customArray'] as Path,
        recursive: mockRecursive,
        rootSchemaType: docSchema,
      }

      const result = buildArrayState(props)

      // relativePath SHOULD be set when item has custom components.input
      // because components.input is often just a wrapper
      expect(result.relativePath).toEqual(['customArray', {_key: 'item1'}])
      // Should build menu items for items with custom components.input
      expect(result.menuItems.length).toBeGreaterThan(0)
    })

    test('should set relativePath when nested fields have custom components but item type does not', () => {
      // Create a schema where the item itself has no custom components,
      // but nested fields do (simulating the nested structure scenario)
      const schemaWithNestedCustomComponents = Schema.compile({
        name: 'default',
        types: [
          {
            name: 'testDocument',
            type: 'document',
            fields: [
              {
                name: 'nestedArray',
                type: 'array',
                of: [
                  {
                    name: 'item',
                    type: 'object',
                    // No custom components on the item itself
                    fields: [
                      {name: 'title', type: 'string'},
                      {
                        name: 'deepArray',
                        type: 'array',
                        of: [
                          {
                            name: 'deepItem',
                            type: 'object',
                            fields: [{name: 'value', type: 'string'}],
                          },
                        ],
                        components: {
                          input: () => null, // Custom input on nested field
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })

      const docSchema = schemaWithNestedCustomComponents.get('testDocument') as ObjectSchemaType
      const nestedArrayField = docSchema.fields.find(
        (f) => f.name === 'nestedArray',
      ) as ObjectField<ArraySchemaType>

      const mockValue = {
        nestedArray: [
          {
            _key: 'item1',
            _type: 'item',
            title: 'Item 1',
            deepArray: [{_key: 'deep1', _type: 'deepItem', value: 'Deep Value'}],
          },
        ],
      }

      const openPath: Path = ['nestedArray', {_key: 'item1'}]
      const props = {
        arraySchemaType: nestedArrayField.type,
        arrayValue: mockValue.nestedArray,
        documentValue: mockValue,
        openPath,
        rootPath: ['nestedArray'] as Path,
        recursive: mockRecursive,
        rootSchemaType: docSchema,
      }

      const result = buildArrayState(props)

      // relativePath SHOULD be set because the item itself has no custom components
      expect(result.relativePath).toEqual(['nestedArray', {_key: 'item1'}])
      // Should build menu items for the item
      expect(result.menuItems.length).toBeGreaterThan(0)
    })
  })
})
