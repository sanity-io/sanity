import {type SchemaTypeDefinition} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {definePlugin} from '../definePlugin'
import {resolveConfigProperty} from '../resolveConfigProperty'
import {type AsyncConfigPropertyReducer, type ConfigPropertyReducer} from '../types'

describe('resolveConfigProperty', () => {
  it('traverses configs and returns a resolved configuration property', () => {
    const subPlugin = definePlugin({
      name: 'sub-plugin',
      schema: {
        types: [
          {
            name: 'sub-plugin',
            type: 'document',
            fields: [{name: 'name', type: 'string'}],
          },
        ],
      },
    })

    const plugin = definePlugin({
      name: 'plugin',
      plugins: [subPlugin()],
      schema: {
        types: [
          {
            name: 'plugin',
            type: 'document',
            fields: [{name: 'name', type: 'string'}],
          },
        ],
      },
    })

    const parent = definePlugin({
      name: 'parent',
      plugins: [plugin()],
      schema: {
        types: [
          {
            name: 'parent',
            type: 'document',
            fields: [{name: 'name', type: 'string'}],
          },
        ],
      },
    })

    const context = {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const reducer = vi.fn<ConfigPropertyReducer<SchemaTypeDefinition[], unknown>>(
      (prev, config, _context) => {
        return [...prev, ...((config.schema?.types || []) as SchemaTypeDefinition[])]
      },
    )

    const result = resolveConfigProperty({
      config: {
        name: 'config',
        plugins: [parent()],
        schema: {types: []},
      },
      context,
      initialValue: [],
      propertyName: 'schema.types',
      reducer,
    })

    expect(result).toEqual([
      {
        fields: [{name: 'name', type: 'string'}],
        name: 'sub-plugin',
        type: 'document',
      },
      {
        fields: [{name: 'name', type: 'string'}],
        name: 'plugin',
        type: 'document',
      },
      {
        fields: [{name: 'name', type: 'string'}],
        name: 'parent',
        type: 'document',
      },
    ])

    expect(reducer).toBeCalledTimes(4)
    expect(reducer.mock.calls[0][2]).toBe(context)
  })

  it('works with `asyncReducer`s', async () => {
    const foo = definePlugin({
      name: 'foo',
      schema: {
        types: [
          {
            name: 'foo',
            type: 'document',
            fields: [{name: 'name', type: 'string'}],
          },
        ],
      },
    })

    const parent = definePlugin({
      name: 'parent',
      plugins: [foo()],
      schema: {
        types: [
          {
            name: 'parent',
            type: 'document',
            fields: [{name: 'name', type: 'string'}],
          },
        ],
      },
    })

    const context = {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const asyncReducer = vi.fn<AsyncConfigPropertyReducer<SchemaTypeDefinition[], unknown>>(
      async (prev, config, _context) => {
        await new Promise((resolve) => setTimeout(resolve, 0))
        return [...prev, ...((config.schema?.types || []) as SchemaTypeDefinition[])]
      },
    )

    const result = await resolveConfigProperty({
      config: {
        name: 'config',
        plugins: [parent()],
        schema: {types: []},
      },
      context,
      initialValue: [],
      propertyName: 'schema.types',
      asyncReducer,
    })

    expect(result).toEqual([
      {
        fields: [{name: 'name', type: 'string'}],
        name: 'foo',
        type: 'document',
      },
      {
        fields: [{name: 'name', type: 'string'}],
        name: 'parent',
        type: 'document',
      },
    ])

    expect(asyncReducer).toBeCalledTimes(3)
    expect(asyncReducer.mock.calls[0][2]).toBe(context)
  })

  it('throws `ConfigPropertyError`s with breadcrumbs', () => {
    const deepest = definePlugin({name: 'deepest'})
    const deeper = definePlugin({name: 'deeper', plugins: [deepest()]})
    const deep = definePlugin({name: 'deep', plugins: [deeper()]})

    expect(
      resolveConfigProperty({
        propertyName: 'example',
        config: {name: 'config', plugins: [deep()]},
        initialValue: null,
        context: {},
        asyncReducer: async (prev, config) => {
          await new Promise((resolve) => setTimeout(resolve, 0))
          if (config.name === 'deepest') throw new Error('example error')
          return prev
        },
      }),
    ).rejects.toMatchInlineSnapshot(
      `[ConfigPropertyError: An error occurred while resolving \`example\` from config > deep > deeper > deepest: example error]`,
    )
  })
})
