import {Schema} from '@sanity/schema'
import {type ObjectField, type ObjectSchemaType, type Path, type SchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {findPTEtypePaths, isPathTextInPTEField} from '../isPathTextInPTEField'

// Create a proper Sanity schema for testing
const schema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'testDocument',
      title: 'Test Document',
      type: 'document',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
        {
          name: 'body',
          title: 'Body',
          type: 'array',
          of: [
            {type: 'block'},
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
              ],
            },
          ],
        },
        {
          name: 'content',
          title: 'Content',
          type: 'object',
          fields: [
            {
              name: 'description',
              title: 'Description',
              type: 'array',
              of: [{type: 'block'}],
            },
          ],
        },
        {
          name: 'sections',
          title: 'Sections',
          type: 'array',
          of: [
            {
              name: 'section',
              title: 'Section',
              type: 'object',
              fields: [
                {
                  name: 'sectionTitle',
                  title: 'Section Title',
                  type: 'string',
                },
                {
                  name: 'sectionContent',
                  title: 'Section Content',
                  type: 'array',
                  of: [{type: 'block'}],
                },
              ],
            },
          ],
        },
        {
          name: 'animals',
          title: 'Animals',
          type: 'array',
          of: [
            {
              name: 'animal',
              title: 'Animal',
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Animal Name',
                  type: 'string',
                },
                {
                  name: 'description',
                  title: 'Description',
                  type: 'array',
                  of: [
                    {type: 'block'},
                    {
                      name: 'info',
                      title: 'Info',
                      type: 'object',
                      fields: [
                        {
                          name: 'item',
                          title: 'Item',
                          type: 'array',
                          of: [
                            {
                              name: 'property',
                              title: 'Property',
                              type: 'object',
                              fields: [
                                {
                                  name: 'description_two',
                                  title: 'Description Two',
                                  type: 'array',
                                  of: [
                                    {type: 'block'},
                                    {
                                      name: 'info_two',
                                      title: 'Info Two',
                                      type: 'object',
                                      fields: [
                                        {
                                          name: 'item_two',
                                          title: 'Item Two',
                                          type: 'array',
                                          of: [
                                            {
                                              name: 'property_two',
                                              title: 'Property Two',
                                              type: 'object',
                                              fields: [
                                                {
                                                  name: 'description_three',
                                                  title: 'Description Three',
                                                  type: 'array',
                                                  of: [{type: 'block'}],
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
                },
              ],
            },
          ],
        },
        {
          name: 'regularArray',
          title: 'Regular Array',
          type: 'array',
          of: [
            {
              name: 'regularObject',
              title: 'Regular Object',
              type: 'object',
              fields: [
                {
                  name: 'children',
                  title: 'Children',
                  type: 'array',
                  of: [{type: 'string'}],
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
const fields = documentSchema.fields as ObjectField<SchemaType>[]

describe('isPathTextInPTEField', () => {
  test('should return true if the path points to text content within a simple portable text field', () => {
    const path: Path = ['body', {_key: 'abc'}, 'children', {_key: 'def'}]

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(true)
  })

  test('should return true if the path points to text content within a nested portable text field', () => {
    const path: Path = ['content', 'description', {_key: 'block1'}, 'children', {_key: 'span1'}]

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(true)
  })

  test('should return true if the path points to text content within an array of objects containing PTE fields', () => {
    const path: Path = [
      'sections',
      {_key: 'section1'},
      'sectionContent',
      {_key: 'block1'},
      'children',
      {_key: 'span1'},
    ]

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(true)
  })

  test('should return true for deeply nested PTE (2 levels)', () => {
    const path: Path = [
      'animals',
      {_key: 'animal1'},
      'description',
      {_key: 'block1'},
      'item',
      {_key: 'item1'},
      'description_two',
      {_key: 'block2'},
      'children',
      {_key: 'span1'},
    ]

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(true)
  })

  test('should return true for deeply nested PTE (3 levels)', () => {
    const path: Path = [
      'animals',
      {_key: 'animal1'},
      'description',
      {_key: 'block1'},
      'item',
      {_key: 'item1'},
      'description_two',
      {_key: 'block2'},
      'item_two',
      {_key: 'item2'},
      'description_three',
      {_key: 'block3'},
      'children',
      {_key: 'span1'},
    ]

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(true)
  })

  test('should return false if the path points to a PTE field but not to children (text content)', () => {
    const path: Path = ['body', {_key: 'abc'}]

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(false)
  })

  test('should return false if the path contains children but is not within a PTE field', () => {
    const path: Path = ['regularArray', {_key: 'obj1'}, 'children', {_key: 'item1'}]

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(false)
  })

  test('should return false if the path is empty', () => {
    const path: Path = []

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(false)
  })

  test('should return false if the path points to a non-existent field', () => {
    const path: Path = ['nonExistentField', {_key: 'abc'}, 'children', {_key: 'def'}]

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(false)
  })

  test('should return false for paths that point to children but in regular arrays', () => {
    // This is a regular array with a 'children' field, not a PTE
    const path: Path = ['regularArray', {_key: 'item1'}, 'children']

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(false)
  })

  test('should handle paths with only children segment', () => {
    const path: Path = ['children']

    const result = isPathTextInPTEField(fields, path)

    expect(result).toBe(false)
  })
})

describe('findPTEtypePaths', () => {
  test('should find simple PTE paths', () => {
    const result = findPTEtypePaths(fields)

    expect(result).toContainEqual(['body'])
  })

  test('should find nested PTE paths', () => {
    const result = findPTEtypePaths(fields)

    expect(result).toContainEqual(['content', 'description'])
  })

  test('should find PTE paths in arrays of objects', () => {
    const result = findPTEtypePaths(fields)

    expect(result).toContainEqual(['sections', 'sectionContent'])
  })

  test('should find deeply nested PTE paths', () => {
    const result = findPTEtypePaths(fields)

    expect(result).toContainEqual(['animals', 'description'])
    expect(result).toContainEqual(['animals', 'description', 'item', 'description_two'])
    expect(result).toContainEqual([
      'animals',
      'description',
      'item',
      'description_two',
      'item_two',
      'description_three',
    ])
  })

  test('should not include non-PTE arrays', () => {
    const result = findPTEtypePaths(fields)

    expect(result).not.toContainEqual(['regularArray', 'children'])
  })

  test('should return multiple PTE paths', () => {
    const result = findPTEtypePaths(fields)

    // Should find at least these PTE paths
    expect(result.length).toBeGreaterThan(3)
    expect(result).toContainEqual(['body'])
    expect(result).toContainEqual(['content', 'description'])
    expect(result).toContainEqual(['sections', 'sectionContent'])
  })
})
