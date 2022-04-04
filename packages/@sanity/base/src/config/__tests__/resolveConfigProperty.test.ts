import {resolveConfigProperty} from '../resolveConfigProperty'
import {createPlugin} from '../createPlugin'

describe('resolveConfigProperty', () => {
  it('traverses configs and returns a resolved configuration property', () => {
    const foo = createPlugin({
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

    const parent = createPlugin({
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
        name: 'parent',
        type: 'document',
      },
      {
        fields: [{name: 'name', type: 'string'}],
        name: 'foo',
        type: 'document',
      },
    ])

    expect(reducer).toBeCalledTimes(3)
    expect(reducer.mock.calls[0][2]).toBe(context)
  })

  it('works with `asyncReducer`s', async () => {
    const foo = createPlugin({
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

    const parent = createPlugin({
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
        name: 'parent',
        type: 'document',
      },
      {
        fields: [{name: 'name', type: 'string'}],
        name: 'foo',
        type: 'document',
      },
    ])

    expect(asyncReducer).toBeCalledTimes(3)
    expect(asyncReducer.mock.calls[0][2]).toBe(context)
  })

  it('throws `ConfigPropertyError`s with breadcrumbs', () => {
    const deepest = createPlugin({name: 'deepest'})
    const deeper = createPlugin({name: 'deeper', plugins: [deepest()]})
    const deep = createPlugin({name: 'deep', plugins: [deeper()]})

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
