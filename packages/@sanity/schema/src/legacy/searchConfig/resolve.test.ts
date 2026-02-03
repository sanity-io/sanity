import {defineField, defineType, type Schema} from '@sanity/types'
import {describe, expect, test} from 'vitest'

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
                  description: 'This is a string field',
                }),
                defineField({
                  name: 'field3',
                  type: 'object',
                  fields: [
                    defineField({name: 'nested1', title: 'nested1', type: 'string'}),
                    defineField({
                      name: 'nested2',
                      title: 'nested2',
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'ge',
                          title: 'hello',
                          type: 'string',
                        }),
                        defineField({
                          name: 'nested3',
                          title: 'nested3',
                          type: 'object',
                          fields: [
                            defineField({
                              name: 'hello',
                              title: 'hello',
                              type: 'string',
                            }),
                          ],
                        }),
                        defineField({
                          name: 'nested3',
                          title: 'nestedObject3',
                          type: 'object',
                          fields: [
                            defineField({
                              name: 'hello2',
                              title: 'hello2',
                              type: 'string',
                            }),
                            defineField({
                              name: 'nested4',
                              title: 'nested4',
                              type: 'object',
                              fields: [
                                defineField({
                                  name: 'hello3',
                                  title: 'hello3',
                                  type: 'string',
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        defineType({
          name: 'post',
          title: 'Post',
          type: 'document',
          preview: {
            select: {
              title: 'title',
              subtitle: 'nestedObject.field3.nested2.ge',
            },
          },
          fields: [
            defineField({
              name: 'title',
              type: 'string',
            }),
            defineField({
              name: 'nestedObject',
              title: 'Nested object',
              type: 'object',
              fields: [
                defineField({
                  name: 'field3',
                  type: 'object',
                  fields: [
                    defineField({name: 'nested1', title: 'nested1', type: 'string'}),
                    defineField({
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
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })

  describe('resolve', () => {
    test('resolve document preview paths from all levels', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 0)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
        {path: ['role'], weight: 1},
        {path: ['nestedObject', 'field2'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested1'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested2', 'ge'], weight: 1},
      ])
    })
    test('resolve document preview paths from all levels (max 5)', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 10)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
        {path: ['role'], weight: 1},
        {path: ['nestedObject', 'field2'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested1'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested2', 'ge'], weight: 1},
      ])
    })
    test('resolve negative level document preview paths (all fields)', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, -1)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
        {path: ['role'], weight: 1},
        {path: ['nestedObject', 'field2'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested1'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested2', 'ge'], weight: 1},
      ])
    })
    test('resolve 1st level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 1)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
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
      ])
    })

    test('resolve 4th level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 4)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
        {path: ['role'], weight: 1},
        {path: ['nestedObject', 'field2'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested1'], weight: 1},
      ])
    })

    test('resolve 5th level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfig(type, 5)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
        {path: ['role'], weight: 1},
        {path: ['nestedObject', 'field2'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested1'], weight: 1},
        {path: ['nestedObject', 'field3', 'nested2', 'ge'], weight: 1},
      ])
    })
  })

  describe('resolveSearchConfigForBaseFieldPaths', () => {
    test('resolve default document preview paths (all fields, up to 5 levels)', () => {
      const schema = getTestSchema()
      const type = schema.get('author')

      expect(resolveSearchConfigForBaseFieldPaths(type, 0)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['name'], weight: 10},
        {path: ['nestedObject', 'field1'], weight: 5},
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
    test('resolve 4th level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('post')

      expect(resolveSearchConfigForBaseFieldPaths(type, 4)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['title'], weight: 10},
        {path: ['nestedObject', 'field3', 'nested2', 'ge'], weight: 5},
      ])
    })

    test('resolve 5th level document preview paths', () => {
      const schema = getTestSchema()
      const type = schema.get('post')

      expect(resolveSearchConfigForBaseFieldPaths(type, 5)).toMatchObject([
        {path: ['_id'], weight: 1},
        {path: ['_type'], weight: 1},
        {path: ['title'], weight: 10},
        {path: ['nestedObject', 'field3', 'nested2', 'ge'], weight: 5},
      ])
    })
  })
})
