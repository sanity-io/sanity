import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {getReadOnlyForPath} from '../getReadOnlyForPath'

describe('getReadOnlyForPath', () => {
  test('should return false for empty path', () => {
    const schema = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, [])).toBe(false)
  })

  test('should return false for non-existent field', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'title',
          type: {type: 'string', name: 'string', jsonType: 'string'},
        },
      ],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, ['nonExistent'])).toBe(false)
  })

  test('should return true if the field has readOnly set to true', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'title',
          type: {
            type: 'string',
            name: 'string',
            jsonType: 'string',
            readOnly: true,
          },
        },
      ],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, ['title'])).toBe(true)
  })

  test('should return false if the field does not have readOnly', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'title',
          type: {type: 'string', name: 'string', jsonType: 'string'},
        },
      ],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, ['title'])).toBe(false)
  })

  test('should return true if array items have readOnly set to true', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'items',
          type: {
            type: 'array',
            name: 'array',
            jsonType: 'array',
            of: [
              {
                type: 'object',
                name: 'item',
                jsonType: 'object',
                readOnly: true,
                fields: [],
              },
            ],
          },
        },
      ],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, ['items', {_key: 'test'}])).toBe(true)
  })

  test('should return false if array items do not have readOnly', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'items',
          type: {
            type: 'array',
            name: 'array',
            jsonType: 'array',
            of: [
              {
                type: 'object',
                name: 'item',
                jsonType: 'object',
                fields: [],
              },
            ],
          },
        },
      ],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, ['items', {_key: 'test'}])).toBe(false)
  })

  test('should return true for nested field with readOnly in object', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'author',
          type: {
            type: 'object',
            name: 'authorType',
            jsonType: 'object',
            fields: [
              {
                name: 'name',
                type: {
                  type: 'string',
                  name: 'string',
                  jsonType: 'string',
                  readOnly: true,
                },
              },
            ],
          },
        },
      ],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, ['author', 'name'])).toBe(true)
  })

  test('should return false for nested field without readOnly in object', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'author',
          type: {
            type: 'object',
            name: 'authorType',
            jsonType: 'object',
            fields: [
              {
                name: 'name',
                type: {type: 'string', name: 'string', jsonType: 'string'},
              },
            ],
          },
        },
      ],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, ['author', 'name'])).toBe(false)
  })

  test('should return true for deeply nested array with readOnly items', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'animals',
          type: {
            type: 'array',
            name: 'array',
            jsonType: 'array',
            of: [
              {
                type: 'object',
                name: 'animal',
                jsonType: 'object',
                readOnly: true,
                fields: [
                  {
                    name: 'friends',
                    type: {
                      type: 'array',
                      name: 'friendsArray',
                      jsonType: 'array',
                      of: [
                        {
                          type: 'object',
                          name: 'friend',
                          jsonType: 'object',
                          readOnly: true,
                          fields: [],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    } as unknown as ObjectSchemaType

    // Should detect readOnly at the top-level array
    expect(getReadOnlyForPath(schema, ['animals', {_key: 'animal1'}])).toBe(true)

    // Should also detect readOnly in nested array
    expect(
      getReadOnlyForPath(schema, ['animals', {_key: 'animal1'}, 'friends', {_key: 'friend1'}]),
    ).toBe(true)
  })

  test('should return true if parent array field has readOnly', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'items',
          type: {
            type: 'array',
            name: 'array',
            jsonType: 'array',
            readOnly: true,
            of: [
              {
                type: 'object',
                name: 'item',
                jsonType: 'object',
                fields: [],
              },
            ],
          },
        },
      ],
    } as unknown as ObjectSchemaType

    expect(getReadOnlyForPath(schema, ['items'])).toBe(true)
  })

  test('should return true if any array item type has readOnly', () => {
    const schema: ObjectSchemaType = {
      type: 'object',
      name: 'test',
      jsonType: 'object',
      fields: [
        {
          name: 'items',
          type: {
            type: 'array',
            name: 'array',
            jsonType: 'array',
            of: [
              {
                type: 'object',
                name: 'typeA',
                jsonType: 'object',
                fields: [],
              },
              {
                type: 'object',
                name: 'typeB',
                jsonType: 'object',
                readOnly: true,
                fields: [],
              },
            ],
          },
        },
      ],
    } as unknown as ObjectSchemaType

    // Should return true because at least one item type has readOnly
    expect(getReadOnlyForPath(schema, ['items', {_key: 'test'}])).toBe(true)
  })
})
