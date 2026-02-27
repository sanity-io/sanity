import {Schema} from '@sanity/schema'
import {type SchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {getPathTitles} from '../getPathTitles'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {name: 'name', title: 'Name', type: 'string'},
        {name: 'age', title: 'Age', type: 'number'},
        {
          name: 'bio',
          title: 'Biography',
          type: 'object',
          fields: [
            {name: 'short', title: 'Short Bio', type: 'string'},
            {name: 'full', title: 'Full Bio', type: 'text'},
          ],
        },
        {
          name: 'tags',
          title: 'Tags',
          type: 'array',
          of: [{type: 'string'}],
        },
        {
          name: 'socialLinks',
          title: 'Social Links',
          type: 'array',
          of: [
            {
              name: 'socialLink',
              title: 'Social Link',
              type: 'object',
              fields: [
                {name: 'platform', title: 'Platform', type: 'string'},
                {name: 'url', title: 'URL', type: 'string'},
              ],
            },
          ],
        },
        {
          name: 'interests',
          type: 'array',
          of: [
            {
              title: 'Interest',
              type: 'object',
              fields: [{name: 'name', title: 'Name', type: 'string'}],
            },
          ],
        },
        {
          name: 'scores',
          title: 'Scores',
          type: 'array',
          of: [{type: 'number'}],
        },
        {
          name: 'active',
          title: 'Active',
          type: 'array',
          of: [{type: 'boolean'}],
        },
      ],
    },
  ],
})

const authorType = mockSchema.get('author') as SchemaType

describe('getPathTitles', () => {
  describe('string segments (field names)', () => {
    test('returns schema type for a simple string field', () => {
      const result = getPathTitles({
        path: ['name'],
        schemaType: authorType,
        value: {_type: 'author', name: 'John'},
      })

      expect(result).toHaveLength(1)
      // The result contains the field's type, which is 'string'
      expect(result[0]).toHaveProperty('name', 'string')
      expect(result[0]).toHaveProperty('jsonType', 'string')
    })

    test('returns schema types for nested object fields', () => {
      const result = getPathTitles({
        path: ['bio', 'short'],
        schemaType: authorType,
        value: {_type: 'author', bio: {short: 'A short bio'}},
      })

      expect(result).toHaveLength(2)
      // First is the 'bio' field type - inline object types have name 'object'
      expect(result[0]).toHaveProperty('jsonType', 'object')
      // Second is the 'short' field type (a string type)
      expect(result[1]).toHaveProperty('name', 'string')
      expect(result[1]).toHaveProperty('jsonType', 'string')
    })

    test('returns partial result when field is not found in schema', () => {
      const result = getPathTitles({
        path: ['nonExistentField'],
        schemaType: authorType,
        value: {_type: 'author'},
      })

      expect(result).toHaveLength(1)
      // When field is not found, it pushes {name: segment} directly
      expect(result[0]).toEqual({name: 'nonExistentField'})
    })

    test('handles undefined value for field access', () => {
      const result = getPathTitles({
        path: ['name'],
        schemaType: authorType,
        value: {_type: 'author'},
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('name', 'string')
    })

    test('throws error when parent value is not an object', () => {
      expect(() =>
        getPathTitles({
          path: ['name'],
          schemaType: authorType,
          value: 'not an object' as any,
        }),
      ).toThrow('Parent value is not an object, cannot get path segment: .name')
    })
  })

  describe('number segments (array indices)', () => {
    test('returns schema type for string array item by index', () => {
      const result = getPathTitles({
        path: ['tags', 0],
        schemaType: authorType,
        value: {_type: 'author', tags: ['tag1', 'tag2']},
      })

      expect(result).toHaveLength(2)
      // First is the 'tags' field type - inline array types have name 'array'
      expect(result[0]).toHaveProperty('jsonType', 'array')
      // Second is the array item type (string)
      expect(result[1]).toHaveProperty('jsonType', 'string')
    })

    test('returns schema type for number array item by index', () => {
      const result = getPathTitles({
        path: ['scores', 0],
        schemaType: authorType,
        value: {_type: 'author', scores: [100, 95]},
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('jsonType', 'array')
      expect(result[1]).toHaveProperty('jsonType', 'number')
    })

    test('returns schema type for boolean array item by index', () => {
      const result = getPathTitles({
        path: ['active', 0],
        schemaType: authorType,
        value: {_type: 'author', active: [true, false]},
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('jsonType', 'array')
      expect(result[1]).toHaveProperty('jsonType', 'boolean')
    })

    test('returns schema type for object array item by index', () => {
      const result = getPathTitles({
        path: ['socialLinks', 0],
        schemaType: authorType,
        value: {
          _type: 'author',
          socialLinks: [
            {_type: 'socialLink', _key: 'a', platform: 'twitter', url: 'https://x.com'},
          ],
        },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('jsonType', 'array')
      // Named types preserve their name
      expect(result[1]).toHaveProperty('name', 'socialLink')
      expect(result[1]).toHaveProperty('title', 'Social Link')
      expect(result[1]).toHaveProperty('jsonType', 'object')
    })

    test('throws error when parent value is not an array', () => {
      // Value check happens before type check in the function
      expect(() =>
        getPathTitles({
          path: ['name', 0],
          schemaType: authorType,
          value: {_type: 'author', name: 'not an array'},
        }),
      ).toThrow('Parent value is not an array, cannot get path segment: [0]')
    })

    test('throws error when schema type is not an array', () => {
      // To test the schema type check, we need undefined value to skip the value check
      expect(() =>
        getPathTitles({
          path: ['name', 0],
          schemaType: authorType,
          value: {_type: 'author'},
        }),
      ).toThrow('Parent type is not an array schema type, cannot get path segment: [0]')
    })

    test('throws error when item type is not found', () => {
      expect(() =>
        getPathTitles({
          path: ['tags', 0],
          schemaType: authorType,
          value: {_type: 'author', tags: [{notAString: true}]},
        }),
      ).toThrow('Item type not found: [0]')
    })
  })

  describe('key segments (array item keys)', () => {
    test('returns schema type for object array item by key', () => {
      const result = getPathTitles({
        path: ['socialLinks', {_key: 'link1'}],
        schemaType: authorType,
        value: {
          _type: 'author',
          socialLinks: [
            {_type: 'socialLink', _key: 'link1', platform: 'twitter', url: 'https://x.com'},
          ],
        },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('jsonType', 'array')
      expect(result[1]).toHaveProperty('name', 'socialLink')
      expect(result[1]).toHaveProperty('title', 'Social Link')
    })

    test('returns schema type for nested field in array item by key', () => {
      const result = getPathTitles({
        path: ['socialLinks', {_key: 'link1'}, 'platform'],
        schemaType: authorType,
        value: {
          _type: 'author',
          socialLinks: [
            {_type: 'socialLink', _key: 'link1', platform: 'twitter', url: 'https://x.com'},
          ],
        },
      })

      expect(result).toHaveLength(3)
      expect(result[0]).toHaveProperty('jsonType', 'array')
      expect(result[1]).toHaveProperty('name', 'socialLink')
      expect(result[2]).toHaveProperty('name', 'string')
      expect(result[2]).toHaveProperty('jsonType', 'string')
    })
    test('returns schema type for unnamed object in array item by key', () => {
      const result = getPathTitles({
        path: ['interests', {_key: 'interest1'}, 'name'],
        schemaType: authorType,
        value: {
          _type: 'author',
          interests: [{_key: 'interest1', otherValue: true}],
        },
      })

      expect(result).toHaveLength(3)
      expect(result[0]).toHaveProperty('jsonType', 'array')
      // Anonymous objects have name 'object' in compiled schema, but title is preserved
      expect(result[1]).toHaveProperty('name', 'object')
      expect(result[1]).toHaveProperty('title', 'Interest')
      expect(result[1]).toHaveProperty('jsonType', 'object')
      expect(result[2]).toHaveProperty('name', 'string')
      expect(result[2]).toHaveProperty('jsonType', 'string')
    })

    test('returns early when value is undefined (item deleted)', () => {
      const result = getPathTitles({
        path: ['socialLinks', {_key: 'deleted'}],
        schemaType: authorType,
        value: {_type: 'author'},
      })

      // When value is undefined, returns after processing socialLinks
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('jsonType', 'array')
    })

    test('returns early when item with key is not found in array (item deleted)', () => {
      const result = getPathTitles({
        path: ['socialLinks', {_key: 'nonexistent'}],
        schemaType: authorType,
        value: {
          _type: 'author',
          socialLinks: [
            {_type: 'socialLink', _key: 'link1', platform: 'twitter', url: 'https://x.com'},
          ],
        },
      })

      // When item is not found, returns after processing socialLinks
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('jsonType', 'array')
    })

    test('throws error when parent value is not an array for key segment', () => {
      // Value check happens before type check
      expect(() =>
        getPathTitles({
          path: ['name', {_key: 'key1'}],
          schemaType: authorType,
          value: {_type: 'author', name: 'not an array'},
        }),
      ).toThrow('Parent value is not an array')
    })

    test('throws error when schema type is not an array for key segment', () => {
      // To test the schema type check, we need an array value but non-array schema type
      // This is a bit contrived but tests the error path
      expect(() =>
        getPathTitles({
          path: ['name', {_key: 'key1'}],
          schemaType: authorType,
          value: {_type: 'author', name: ['item1']},
        }),
      ).toThrow('Parent type is not an array schema type')
    })

    test('throws error when array item type is not found', () => {
      expect(() =>
        getPathTitles({
          path: ['socialLinks', {_key: 'link1'}],
          schemaType: authorType,
          value: {
            _type: 'author',
            socialLinks: [{_type: 'unknownType', _key: 'link1'}],
          },
        }),
      ).toThrow('Array item type not found: .unknownType')
    })
  })
})
