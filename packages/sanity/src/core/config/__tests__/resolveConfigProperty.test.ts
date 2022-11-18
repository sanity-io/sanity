import {resolveConfigProperty} from '../resolveConfigProperty'
import {definePlugin} from '../definePlugin'

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
    const reducer = jest.fn((prev, config, _context) => {
      return [...prev, ...config.schema.types]
    })

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
    const asyncReducer = jest.fn(async (prev, config, _context) => {
      await new Promise((resolve) => setTimeout(resolve, 0))
      return [...prev, ...config.schema.types]
    })

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
      })
    ).rejects.toMatchInlineSnapshot(
      `"An error occurred while resolving \`example\` from plugin \`config\` > plugin \`deep\` > plugin \`deeper\` > plugin \`deepest\`: example error"`
    )
  })
})
