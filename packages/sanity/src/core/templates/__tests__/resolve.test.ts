import {Schema as SchemaBuilder} from '@sanity/schema'
import {type InitialValueResolverContext} from '@sanity/types'
import {omit} from 'lodash'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {type resolveInitialValue as resolveInitialValueType} from '../resolve'
import {type Template} from '../types'
import {schema} from './schema'

let resolveInitialValue: typeof resolveInitialValueType

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()

  resolveInitialValue = (await import('../')).resolveInitialValue
})

const example: Template = {
  id: 'author',
  title: 'Author',
  schemaType: 'author',
  value: {title: 'here'},
}

const mockConfigContext: InitialValueResolverContext = {
  projectId: 'test-project',
  dataset: 'test-dataset',
  schema: schema,
  currentUser: {id: 'user-123'},
} as InitialValueResolverContext

describe('resolveInitialValue', () => {
  test('serializes builders', async () => {
    await expect(
      resolveInitialValue(schema, example, {}, mockConfigContext),
    ).resolves.toMatchObject({
      title: 'here',
    })
  })

  test('works with raw templates', async () => {
    await expect(
      resolveInitialValue(schema, example, {}, mockConfigContext),
    ).resolves.toMatchObject({
      title: 'here',
    })
  })

  test('throws on missing template `value` prop', async () => {
    await expect(
      resolveInitialValue(schema, omit(example, ['value']) as Template, {}, mockConfigContext),
    ).rejects.toMatchObject({
      message: 'Template "author" has invalid "value" property',
    })
  })

  test('throws on non-function/non-object template `value` prop', async () => {
    await expect(
      resolveInitialValue(schema, {...example, value: []}, {}, mockConfigContext),
    ).rejects.toMatchObject({
      message:
        'Template "author" has invalid "value" property - must be a plain object or a resolver function returning a plain object',
    })
  })

  test('throws on wrong `_type`  prop', async () => {
    await expect(
      resolveInitialValue(schema, {...example, value: {_type: 'foo'}}, {}, mockConfigContext),
    ).rejects.toMatchObject({
      message:
        'Template "author" initial value: includes "_type"-property (foo) that does not match template (author)',
    })
  })

  test('throws on unknown prop in reference', async () => {
    await expect(
      resolveInitialValue(
        schema,
        {...example, value: {bestFriend: {_ref: 'grrm', name: 'GRRM'}}},
        {},
        mockConfigContext,
      ),
    ).rejects.toMatchObject({
      message:
        'Template "author" initial value: Disallowed property found in reference: "name" at path "bestFriend"',
    })
  })

  test('throws on unknown props in reference', async () => {
    await expect(
      resolveInitialValue(
        schema,
        {...example, value: {bestFriend: {_ref: 'grrm', name: 'GRRM', age: 72}}},
        {},
        mockConfigContext,
      ),
    ).rejects.toMatchObject({
      message:
        'Template "author" initial value: Disallowed properties found in reference: "name", "age" at path "bestFriend"',
    })
  })

  test('allows setting known reference properties', async () => {
    await expect(
      resolveInitialValue(
        schema,
        {
          ...example,
          value: {
            bestFriend: {
              _ref: 'grrm',
              _type: 'reference',
              _weak: true,
              _strengthenOnPublish: {type: 'author', template: {id: 'author'}},
            },
          },
        },
        {},
        mockConfigContext,
      ),
    ).resolves.toMatchObject({
      bestFriend: {
        _ref: 'grrm',
        _type: 'reference',
        _weak: true,
        _strengthenOnPublish: {type: 'author', template: {id: 'author'}},
      },
    })
  })

  test('allows setting _dataset on cross-dataset references', async () => {
    await expect(
      resolveInitialValue(
        schema,
        {
          ...example,
          value: {
            bestFriend: {
              _ref: 'grrm',
              _type: 'crossDatasetReference',
              _dataset: 'bffs',
              _projectId: 'beep',
            },
          },
        },
        {},
        mockConfigContext,
      ),
    ).resolves.toMatchObject({
      bestFriend: {
        _ref: 'grrm',
        _type: 'crossDatasetReference',
        _dataset: 'bffs',
        _projectId: 'beep',
      },
    })
  })

  test('should call sync value resolvers', async () => {
    await expect(
      resolveInitialValue(schema, {...example, value: () => example.value}, {}, mockConfigContext),
    ).resolves.toMatchObject({
      title: 'here',
    })
  })

  test('should call async value resolvers', async () => {
    await expect(
      resolveInitialValue(
        schema,
        {
          ...example,
          value: () => Promise.resolve(example.value),
        },
        {},
        mockConfigContext,
      ),
    ).resolves.toMatchObject({
      title: 'here',
    })
  })

  test('throws on wrong value type resolved', async () => {
    await expect(
      resolveInitialValue(schema, {...example, value: () => null}, {}, mockConfigContext),
    ).rejects.toMatchObject({
      message:
        'Template "author" has invalid "value" property - must be a plain object or a resolver function returning a plain object',
    })
  })

  // todo: we should validate based on schema type here and reenable this test
  //  Currently the initial value validator is not schema aware and fails if resolved initial value is missing _type
  //  but this doesn't account for fields of type object, which is a valid case for omitting _type.
  test.skip('throws on values with sub-objects missing `_type`', async () => {
    await expect(
      resolveInitialValue(
        schema,
        {
          ...example,
          value: {image: {_type: 'image', meta: {foo: 'foo'}}},
        },
        {},
        mockConfigContext,
      ),
    ).rejects.toMatchObject({
      message: 'Template "author" initial value: missing "_type" property at path "image.meta"',
    })
  })

  test('applies missing `_type` to references', async () => {
    await expect(
      resolveInitialValue(
        schema,
        {
          ...example,
          value: {image: {_type: 'image', asset: {_ref: 'foo'}}},
        },
        {},
        mockConfigContext,
      ),
    ).resolves.toMatchObject({image: {_type: 'image', asset: {_ref: 'foo', _type: 'reference'}}})
  })

  test('applies missing `_key` to array object children', async () => {
    const result = await resolveInitialValue(
      schema,
      {
        ...example,
        value: {categories: [{_ref: 'php'}, {_ref: 'js'}]},
      },
      {},
      mockConfigContext,
    )

    expect(result).toMatchObject({
      categories: [
        {_ref: 'php', _type: 'reference'},
        {_ref: 'js', _type: 'reference'},
      ],
    })

    expect(result.categories[0]).toHaveProperty('_key')
    expect(result.categories[1]).toHaveProperty('_key')
    expect(result.categories[0]._key).toMatch(/^[a-z0-9][a-z0-9-_]{8,30}/i)
    expect(result.categories[1]._key).toMatch(/^[a-z0-9][a-z0-9-_]{8,30}/i)
  })

  test('applies missing `_key` to array object children deeply', async () => {
    const result = await resolveInitialValue(
      schema,
      {
        ...example,
        value: {meta: [{_type: 'holder', categories: [{_ref: 'php'}, {_ref: 'js'}]}]},
      },
      {},
      mockConfigContext,
    )

    expect(result).toMatchObject({
      meta: [
        {
          _type: 'holder',
          categories: [
            {_ref: 'php', _type: 'reference'},
            {_ref: 'js', _type: 'reference'},
          ],
        },
      ],
    })

    expect(result.meta[0].categories[0]).toHaveProperty('_key')
    expect(result.meta[0].categories[1]).toHaveProperty('_key')
    expect(result.meta[0].categories[0]._key).toMatch(/^[a-z0-9][a-z0-9-_]{8,30}/i)
    expect(result.meta[0].categories[1]._key).toMatch(/^[a-z0-9][a-z0-9-_]{8,30}/i)
  })

  describe('with empty initial values', () => {
    const getTestSchema = (initialValue: unknown) =>
      SchemaBuilder.compile({
        name: 'empty',
        types: [
          {
            name: 'author',
            title: 'Author',
            type: 'document',
            initialValue,
            fields: [
              {
                name: 'name',
                type: 'string',
              },
              {
                name: 'role',
                type: 'string',
              },
            ],
          },
        ],
      })

    test('adds _type on empty objects', async () => {
      const result = await resolveInitialValue(
        getTestSchema({}),
        {
          ...example,
          value: {},
        },
        {},
        mockConfigContext,
      )

      expect(result).toMatchObject({
        _type: 'author',
      })
    })

    test('adds _type on functions returning empty objects', async () => {
      const result = await resolveInitialValue(
        getTestSchema(() => ({})),
        {
          ...example,
          value: {},
        },
        {},
        mockConfigContext,
      )

      expect(result).toMatchObject({
        _type: 'author',
      })
    })

    test('adds _type on functions returning Promise of empty objects', async () => {
      const result = await resolveInitialValue(
        getTestSchema(() => Promise.resolve({})),
        {
          ...example,
          value: {},
        },
        {},
        mockConfigContext,
      )

      expect(result).toMatchObject({
        _type: 'author',
      })
    })
  })

  describe('memoizes function calls', () => {
    const initialValue = vi.fn().mockReturnValue('Name')

    const testSchema = SchemaBuilder.compile({
      name: 'default',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [
            {
              name: 'name',
              type: 'string',
              initialValue,
            },
          ],
        },
      ],
    })

    test('caches based on stable JSON stringification', async () => {
      // Objects with same content but different order should hit same cache
      const params1 = {a: 1, b: 2}
      const params2 = {b: 2, a: 1}

      await resolveInitialValue(testSchema, example, params1, mockConfigContext, {useCache: true})
      await resolveInitialValue(testSchema, example, params2, mockConfigContext, {useCache: true})

      expect(initialValue).toHaveBeenCalledTimes(1)
    })

    test('differentiates cache based on nested object contents', async () => {
      const params1 = {nested: {a: 1, b: 2}}
      const params2 = {nested: {a: 1, b: 3}} // Different nested value

      await resolveInitialValue(testSchema, example, params1, mockConfigContext, {useCache: true})
      await resolveInitialValue(testSchema, example, params2, mockConfigContext, {useCache: true})

      expect(initialValue).toHaveBeenCalledTimes(2)
    })

    test('handles array order in cache key generation', async () => {
      const params1 = {arr: [1, 2, 3]}
      const params2 = {arr: [1, 2, 3]} // Same array
      const params3 = {arr: [3, 2, 1]} // Different order

      await resolveInitialValue(testSchema, example, params1, mockConfigContext, {useCache: true})
      await resolveInitialValue(testSchema, example, params2, mockConfigContext, {useCache: true})
      await resolveInitialValue(testSchema, example, params3, mockConfigContext, {useCache: true})

      expect(initialValue).toHaveBeenCalledTimes(2) // Different order = different cache key
    })

    test('respects useCache option', async () => {
      const params = {test: 'value'}

      // With caching
      await resolveInitialValue(testSchema, example, params, mockConfigContext, {useCache: true})
      await resolveInitialValue(testSchema, example, params, mockConfigContext, {useCache: true})
      expect(initialValue).toHaveBeenCalledTimes(1)

      // Without caching
      await resolveInitialValue(testSchema, example, params, mockConfigContext, {useCache: false})
      await resolveInitialValue(testSchema, example, params, mockConfigContext, {useCache: false})
      expect(initialValue).toHaveBeenCalledTimes(3)
    })

    test('creates separate cache entries for different schema types', async () => {
      const initialValueName = vi.fn(() => 'initial name')
      const initialValueTitle = vi.fn(() => 'initial title')
      const schemaWithTwoTypes = SchemaBuilder.compile({
        name: 'default',
        types: [
          {
            name: 'author',
            type: 'document',
            fields: [{name: 'name', type: 'string', initialValue: initialValueName}],
          },
          {
            name: 'book',
            type: 'document',
            fields: [{name: 'title', type: 'string', initialValue: initialValueTitle}],
          },
        ],
      })

      const authorTemplate = {...example, schemaType: 'author'}
      const bookTemplate = {...example, schemaType: 'book'}

      await resolveInitialValue(schemaWithTwoTypes, authorTemplate, {}, mockConfigContext, {
        useCache: true,
      })
      await resolveInitialValue(schemaWithTwoTypes, bookTemplate, {}, mockConfigContext, {
        useCache: true,
      })

      expect(initialValueName).toHaveBeenCalled()
      expect(initialValueTitle).toHaveBeenCalled()
    })

    test('caches context based on relevant properties only', async () => {
      const context1 = {
        ...mockConfigContext,
        irrelevantProp: 'should-not-affect-cache',
      }
      const context2 = {
        ...mockConfigContext,
        irrelevantProp: 'different-value',
      }

      await resolveInitialValue(testSchema, example, {}, context1, {useCache: true})
      await resolveInitialValue(testSchema, example, {}, context2, {useCache: true})

      expect(initialValue).toHaveBeenCalledTimes(1)
    })

    test('creates new cache entries when context changes', async () => {
      const baseContext = {...mockConfigContext}
      const contexts = [
        {...baseContext, projectId: 'project1'},
        {...baseContext, projectId: 'project2'},
        {...baseContext, dataset: 'dataset2'},
        {...baseContext, currentUser: {id: 'user2'}},
      ] as InitialValueResolverContext[]

      for (const context of contexts) {
        await resolveInitialValue(testSchema, example, {}, context, {useCache: true})
      }

      expect(initialValue).toHaveBeenCalledTimes(4)
    })

    test('handles null and undefined in parameters correctly', async () => {
      const params1 = {a: null}
      const params2 = {a: undefined}
      const params3 = {a: null} // Same as params1

      await resolveInitialValue(testSchema, example, params1, mockConfigContext, {useCache: true})
      await resolveInitialValue(testSchema, example, params2, mockConfigContext, {useCache: true})
      await resolveInitialValue(testSchema, example, params3, mockConfigContext, {useCache: true})

      expect(initialValue).toHaveBeenCalledTimes(2) // null and undefined are treated differently
    })
  })
})
