import {type Schema, defineField, defineType} from '@sanity/types'
import {Schema as SchemaBuilder} from '../Schema'
import {resolveSearchConfig, resolveSearchConfigForBaseFieldPaths} from './resolve'

describe('searchConfig', () => {
  const getTestSchema = (): Schema =>
    SchemaBuilder.compile({
      name: 'empty',
      types: [
        defineType({
          name: 'author',
          title: 'Author',
          type: 'document',
          preview: {
            select: {
              title: 'name',
              subtitle: 'nestedObject.field1',
            },
          },
          fields: [
            defineField({
              name: 'name',
              type: 'string',
            }),
            defineField({
              name: 'role',
              type: 'string',
            }),
            defineField({
              name: 'nestedObject',
              title: 'Nested object',
              type: 'object',
              fields: [
                defineField({
                  name: 'field1',
                  type: 'string',
                  description: 'This is a string field',
                }),
                defineField({
                  name: 'field2',
                  type: 'string',
                  description: 'This is a collapsed field',
                }),
                defineField({
                  name: 'field3',
                  type: 'object',
                  fields: [
                    {name: 'nested1', title: 'nested1', type: 'string'},
                    {
                      name: 'nested2',
                      title: 'nested2',
                      type: 'object',
                      fields: [
                        {
                          name: 'ge',
                          title: 'hello',
                          type: 'string',
                        },
                      ],
                    },
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })

  describe('resolve', () => {
    test('resolve root level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 0)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
      ])
    })
    test('resolve 1st level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 1)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
        {path: ['role'], weight: 1},
      ])
    })
    test('resolve 2nd level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 2)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
        {path: ['role'], weight: 1},
        {path: ['nestedObject', 'field2'], weight: 1},
      ])
    })
    test('resolve 3rd level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 3)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
        {path: ['role'], weight: 1},
        {path: ['nestedObject', 'field2'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested1'], weight: 1},
      ])
    })
  })

  describe('resolveSearchConfigForBaseFieldPaths', () => {
    test('resolve root level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfigForBaseFieldPaths(type, 0)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
      ])
    })
    test('resolve negative level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfigForBaseFieldPaths(type, -1)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
      ])
    })
    test('resolve 1st level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfigForBaseFieldPaths(type, 1)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
      ])
    })
    test('resolve 2nd level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfigForBaseFieldPaths(type, 2)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
      ])
    })
    test('resolve 3rd level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfigForBaseFieldPaths(type, 3)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
      ])
    })
  })
})
