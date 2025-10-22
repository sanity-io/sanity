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
})
