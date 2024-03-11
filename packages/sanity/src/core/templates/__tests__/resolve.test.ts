import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {type InitialValueResolverContext} from '@sanity/types'
import {omit} from 'lodash'

import {resolveInitialValue, type Template} from '../'
import {schema} from './schema'

beforeEach(() => {
  jest.resetModules()
})

const example: Template = {
  id: 'author',
  title: 'Author',
  schemaType: 'author',
  value: {title: 'here'},
}

const mockConfigContext: InitialValueResolverContext = {} as InitialValueResolverContext

describe('resolveInitialValue', () => {
  test('serializes builders', () => {
    expect(resolveInitialValue(schema, example, {}, mockConfigContext)).resolves.toMatchObject({
      title: 'here',
    })
  })

  test('works with raw templates', () => {
    expect(resolveInitialValue(schema, example, {}, mockConfigContext)).resolves.toMatchObject({
      title: 'here',
    })
  })

  test('throws on missing template `value` prop', () => {
    expect(
      resolveInitialValue(schema, omit(example, ['value']) as Template, {}, mockConfigContext),
    ).rejects.toMatchObject({
      message: 'Template "author" has invalid "value" property',
    })
  })

  test('throws on non-function/non-object template `value` prop', () => {
    expect(
      resolveInitialValue(schema, {...example, value: []}, {}, mockConfigContext),
    ).rejects.toMatchObject({
      message:
        'Template "author" has invalid "value" property - must be a plain object or a resolver function returning a plain object',
    })
  })

  test('throws on wrong `_type`  prop', () => {
    expect(
      resolveInitialValue(schema, {...example, value: {_type: 'foo'}}, {}, mockConfigContext),
    ).rejects.toMatchObject({
      message:
        'Template "author" initial value: includes "_type"-property (foo) that does not match template (author)',
    })
  })

  test('throws on unknown prop in reference', () => {
    expect(
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

  test('throws on unknown props in reference', () => {
    expect(
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

  test('allows setting known reference properties', () => {
    expect(
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

  test('allows setting _dataset on cross-dataset references', () => {
    expect(
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

  test('should call sync value resolvers', () => {
    expect(
      resolveInitialValue(schema, {...example, value: () => example.value}, {}, mockConfigContext),
    ).resolves.toMatchObject({
      title: 'here',
    })
  })

  test('should call async value resolvers', () => {
    expect(
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

  test('throws on wrong value type resolved', () => {
    expect(
      resolveInitialValue(schema, {...example, value: () => null}, {}, mockConfigContext),
    ).rejects.toMatchObject({
      message:
        'Template "author" has invalid "value" property - must be a plain object or a resolver function returning a plain object',
    })
  })

  // todo: we should validate based on schema type here and reenable this test
  //  Currently the initial value validator is not schema aware and fails if resolved initial value is missing _type
  //  but this doesn't account for fields of type object, which is a valid case for omitting _type.
  test.skip('throws on values with sub-objects missing `_type`', () => {
    expect(
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

  test('applies missing `_type` to references', () => {
    expect(
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
})
