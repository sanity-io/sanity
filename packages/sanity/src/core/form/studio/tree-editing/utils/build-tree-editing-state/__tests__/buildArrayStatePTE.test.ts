import {Schema} from '@sanity/schema'
import {
  type ArraySchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
} from '@sanity/types'
import {describe, expect, test, vi} from 'vitest'

import {type DialogItem} from '../../../types'
import {buildArrayStatePTE} from '../buildArrayStatePTE'
import {type TreeEditingState} from '../buildTreeEditingState'

// Mock schema for portable text with nested arrays
const schema = Schema.compile({
  name: 'default',
  types: [
    // Required built-in types for image support
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
          name: 'body',
          title: 'Body',
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
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                },
                {
                  name: 'items',
                  title: 'Items',
                  type: 'array',
                  of: [
                    {
                      name: 'item',
                      title: 'Item',
                      type: 'object',
                      fields: [
                        {
                          name: 'name',
                          title: 'Name',
                          type: 'string',
                        },
                        {
                          name: 'nestedItems',
                          title: 'Nested Items',
                          type: 'array',
                          of: [
                            {
                              name: 'nestedItem',
                              title: 'Nested Item',
                              type: 'object',
                              fields: [
                                {
                                  name: 'value',
                                  title: 'Value',
                                  type: 'string',
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
                  name: 'image',
                  title: 'Image',
                  type: 'image',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

const documentSchema = schema.get('testDocument') as ObjectSchemaType
const bodyField = documentSchema.fields.find(
  (field) => field.name === 'body',
) as ObjectField<ArraySchemaType>

// Mock document value with portable text content
const mockDocumentValue = {
  _id: 'test-doc',
  _type: 'testDocument',
  body: [
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
          nestedItems: [
            {
              _key: 'nested1',
              _type: 'nestedItem',
              value: 'Nested Value 1',
            },
          ],
        },
      ],
    },
  ],
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
function createTestProps(overrides: Partial<Parameters<typeof buildArrayStatePTE>[0]> = {}) {
  const defaultProps = {
    childField: bodyField,
    childPath: ['body'] as Path,
    childValue: mockDocumentValue.body,
    documentValue: mockDocumentValue,
    openPath: ['body'] as Path,
    recursive: mockRecursive,
    rootSchemaType: documentSchema,
    breadcrumbs: [] as DialogItem[],
    childrenMenuItems: [] as DialogItem[],
  }

  return {...defaultProps, ...overrides}
}

describe('buildArrayStatePTE', () => {
  test('when openPath points to a nested array field, it should return the correct relative path', () => {
    const openPath: Path = ['body', {_key: 'custom1'}, 'items', {_key: 'item1'}]
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    expect(result.relativePath).toEqual(['body', {_key: 'custom1'}, 'items', {_key: 'item1'}])
  })

  test('when openPath points to a block, it should return the correct relative path', () => {
    const openPath: Path = ['body', {_key: 'custom1'}]
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    // Should redirect to the first array field within the block
    expect(result.relativePath).toEqual(['body', {_key: 'custom1'}])
  })

  test('when openPath points to a text block, it should return null', () => {
    const openPath: Path = ['body', {_key: 'block1'}, 'children', {_key: 'span1'}]
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    expect(result.relativePath).toBeNull()
  })

  test('when openPath points to a non-existent item (new item), it should return the correct relative path', () => {
    const openPath: Path = ['body', {_key: 'custom1'}, 'items', {_key: 'nonexistent'}]
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    // Should point to the parent array since the item doesn't exist
    expect(result.relativePath).toEqual(['body', {_key: 'custom1'}, 'items'])
  })

  test('when openPath points to a nested array field, it should return the correct breadcrumbs', () => {
    const openPath: Path = ['body', {_key: 'custom1'}, 'items', {_key: 'item1'}]
    const breadcrumbs: DialogItem[] = []
    const childrenMenuItems: DialogItem[] = []
    const props = createTestProps({openPath, breadcrumbs, childrenMenuItems})

    const result = buildArrayStatePTE(props)

    // Should have added breadcrumb for the custom block
    expect(result.breadcrumbs).toHaveLength(1)
    expect(result.breadcrumbs[0]).toMatchObject({
      path: ['body', {_key: 'custom1'}],
      schemaType: expect.objectContaining({
        name: 'customBlock',
      }),
      value: expect.objectContaining({
        _key: 'custom1',
        _type: 'customBlock',
      }),
    })
  })

  test('when openPath points to a block, it should return the correct breadcrumbs', () => {
    const openPath: Path = ['body', {_key: 'custom1'}]
    const breadcrumbs: DialogItem[] = []
    const childrenMenuItems: DialogItem[] = []
    const props = createTestProps({openPath, breadcrumbs, childrenMenuItems})

    const result = buildArrayStatePTE(props)

    // Should have added breadcrumb for the custom block
    expect(result.breadcrumbs).toHaveLength(1)
    expect(result.breadcrumbs[0]).toMatchObject({
      path: ['body', {_key: 'custom1'}],
      schemaType: expect.objectContaining({
        name: 'customBlock',
      }),
    })
  })

  test('when openPath points to a text block, it should return null', () => {
    const openPath: Path = ['body', {_key: 'block1'}, 'children', {_key: 'span1'}]
    const breadcrumbs: DialogItem[] = []
    const childrenMenuItems: DialogItem[] = []
    const props = createTestProps({openPath, breadcrumbs, childrenMenuItems})

    const result = buildArrayStatePTE(props)

    // Should not modify breadcrumbs or menu items for text blocks
    expect(result.breadcrumbs).toHaveLength(0)
    expect(result.relativePath).toBeNull()
  })

  test('when openPath points to a non-existent item (new item), it should return the correct breadcrumbs (parents)', () => {
    const openPath: Path = ['body', {_key: 'custom1'}, 'items', {_key: 'nonexistent'}]
    const breadcrumbs: DialogItem[] = []
    const childrenMenuItems: DialogItem[] = []
    const props = createTestProps({openPath, breadcrumbs, childrenMenuItems})

    const result = buildArrayStatePTE(props)

    // Should have added breadcrumb for the custom block (parent)
    expect(result.breadcrumbs).toHaveLength(1)
    expect(result.breadcrumbs[0]).toMatchObject({
      path: ['body', {_key: 'custom1'}],
      schemaType: expect.objectContaining({
        name: 'customBlock',
      }),
    })

    // Should point to the parent array since the item doesn't exist
    expect(result.relativePath).toEqual(['body', {_key: 'custom1'}, 'items'])
  })

  test('when openPath points to deeply nested non-existent item, it should handle key existence check correctly (parent)', () => {
    const openPath: Path = [
      'body',
      {_key: 'custom1'},
      'items',
      {_key: 'item1'},
      'nestedItems',
      {_key: 'nonexistent'},
    ]
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    // Should point to the parent array since the nested item doesn't exist
    expect(result.relativePath).toEqual([
      'body',
      {_key: 'custom1'},
      'items',
      {_key: 'item1'},
      'nestedItems',
    ])
  })

  test('when openPath points to existing deeply nested item, it should return the full path', () => {
    const openPath: Path = [
      'body',
      {_key: 'custom1'},
      'items',
      {_key: 'item1'},
      'nestedItems',
      {_key: 'nested1'},
    ]
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    // Should return the full path since the item exists
    expect(result.relativePath).toEqual([
      'body',
      {_key: 'custom1'},
      'items',
      {_key: 'item1'},
      'nestedItems',
      {_key: 'nested1'},
    ])
  })

  test('when childValue is not an array, it should handle gracefully', () => {
    const props = createTestProps({childValue: null})

    const result = buildArrayStatePTE(props)

    expect(result.relativePath).toBeNull()
    expect(result.breadcrumbs).toHaveLength(0)
  })

  test('when openPath points to regular text content (children), it should return null', () => {
    const openPath: Path = ['body', {_key: 'block1'}, 'children']
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    // Should return null for text content paths
    expect(result.relativePath).toBeNull()
  })

  test('when openPath points to a PTE block item, it should set relativePath to that block', () => {
    const openPath: Path = ['body', {_key: 'custom1'}]
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    // Should return the path to the block item itself
    expect(result.relativePath).toEqual(['body', {_key: 'custom1'}])
  })

  test('when openPath points to nested array items, it should set relativePath correctly', () => {
    const openPath: Path = ['body', {_key: 'custom1'}, 'items', {_key: 'item1'}]
    const props = createTestProps({openPath})

    const result = buildArrayStatePTE(props)

    // Should return the path that was actually requested
    expect(result.relativePath).toEqual(['body', {_key: 'custom1'}, 'items', {_key: 'item1'}])
  })

  test('when openPath points to an image block in PTE, it should set relativePath to that block', () => {
    const openPath: Path = ['body', {_key: 'custom1'}]
    const props = createTestProps({
      openPath,
      childValue: [
        {
          _type: 'customBlock',
          _key: 'custom1',
          title: 'Test Block',
          image: {
            _type: 'image',
            asset: {_ref: 'image-123', _type: 'reference'},
          },
        },
      ],
    })

    const result = buildArrayStatePTE(props)

    // Should return the path to the image block itself
    expect(result.relativePath).toEqual(['body', {_key: 'custom1'}])
  })

  test('when openPath points to an image block, breadcrumbs should be created correctly', () => {
    const openPath: Path = ['body', {_key: 'custom1'}]
    const props = createTestProps({
      openPath,
      childValue: [
        {
          _type: 'customBlock',
          _key: 'custom1',
          title: 'Test Block',
          image: {
            _type: 'image',
            asset: {_ref: 'image-123', _type: 'reference'},
          },
        },
      ],
    })

    const result = buildArrayStatePTE(props)

    // Should have breadcrumbs for the block
    expect(result.breadcrumbs).toHaveLength(1)
    expect(result.breadcrumbs[0].path).toEqual(['body', {_key: 'custom1'}])
    expect(result.breadcrumbs[0].schemaType.name).toBe('customBlock')
  })

  test('when openPath points to a nested array item, it should set siblings correctly', () => {
    const openPath: Path = ['body', {_key: 'custom1'}, 'items', {_key: 'item1'}]
    const props = createTestProps({openPath})

    // Mock the recursive function to return siblings for the nested array
    const mockSiblings = new Map([
      ['body.custom1.items', {count: 2, index: 1}], // First item in the items array
    ])
    mockRecursive.mockReturnValue({
      breadcrumbs: [],
      menuItems: [],
      relativePath: [],
      rootTitle: '',
      siblings: mockSiblings,
    })

    const result = buildArrayStatePTE(props)

    // Should preserve the siblings from the recursive call
    expect(result.siblings.has('body.custom1.items')).toBe(true)
    expect(result.siblings.get('body.custom1.items')).toEqual({count: 2, index: 1})
  })

  test('when openPath points to a nested text block, it should set siblings correctly (none)', () => {
    const openPath: Path = [
      'body',
      {_key: 'custom1'},
      'items',
      {_key: 'item1'},
      'nestedItems',
      {_key: 'nested1'},
      'children',
      {_key: 'span1'},
    ]
    const props = createTestProps({openPath})

    // Mock the recursive function to return siblings for nested arrays
    const mockSiblings = new Map([
      ['body.custom1.items', {count: 2, index: 1}], // First item in items array
      ['body.custom1.items.item1.nestedItems', {count: 3, index: 1}], // First item in nestedItems array
    ])
    mockRecursive.mockReturnValue({
      breadcrumbs: [],
      menuItems: [],
      relativePath: [],
      rootTitle: '',
      siblings: mockSiblings,
    })

    const result = buildArrayStatePTE(props)

    // Should preserve all parent siblings even when pointing to text content
    expect(result.siblings.has('body.custom1.items')).toBe(false)
    expect(result.siblings.has('body.custom1.items.item1.nestedItems')).toBe(false)

    // Should return null for relativePath since it's text content
    expect(result.relativePath).toBeNull()
  })

  test('when openPath points to a nested text block, it should set siblings correctly (deeply nested) - none', () => {
    const openPath: Path = [
      'body',
      {_key: 'custom1'},
      'items',
      {_key: 'item1'},
      'nestedItems',
      {_key: 'nested1'},
      'children',
      {_key: 'span1'},
    ]
    const props = createTestProps({openPath})

    // Mock the recursive function to return siblings for deeply nested arrays
    const mockSiblings = new Map([
      ['body.custom1.items', {count: 2, index: 1}], // First item in items array
      ['body.custom1.items.item1.nestedItems', {count: 3, index: 1}], // First item in nestedItems array
    ])
    mockRecursive.mockReturnValue({
      breadcrumbs: [],
      menuItems: [],
      relativePath: [],
      rootTitle: '',
      siblings: mockSiblings,
    })

    const result = buildArrayStatePTE(props)

    // Should preserve all parent siblings even when pointing to text content
    expect(result.siblings.has('body.custom1.items')).toBe(false)
    expect(result.siblings.has('body.custom1.items.item1.nestedItems')).toBe(false)

    // Should return null for relativePath since it's text content
    expect(result.relativePath).toBeNull()
  })

  test('when openPath points to a object field that has no array fields, it should set siblings correctly (0)', () => {
    const openPath: Path = ['body', {_key: 'custom1'}, 'title']
    const props = createTestProps({openPath})

    // Mock the recursive function to return empty siblings (no arrays in this field)
    mockRecursive.mockReturnValue({
      breadcrumbs: [],
      menuItems: [],
      relativePath: [],
      rootTitle: '',
      siblings: new Map(), // No siblings since title field has no arrays
    })

    const result = buildArrayStatePTE(props)

    // Should have empty siblings since the title field has no array fields
    expect(result.siblings.size).toBe(0)
    expect(result.relativePath).toBeNull() // No array to navigate to
  })
})
