import {createSchema} from '../../../../schema'
import {createCallbackResolver} from '../createCallbackResolver'

const exampleUser = {
  email: 'person@example.com',
  id: 'personId',
  name: 'person',
  roles: [{name: 'admin', title: 'Role Title'}],
}

describe('createCallbackResolver', () => {
  it('returns a function that resolves all hidden or readOnly callbacks', () => {
    const hidden = ({document}: any) => !!document?.shouldHide
    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'example',
          title: 'Example',
          type: 'document',
          fields: [
            {name: 'shouldHide', type: 'boolean'},
            {name: 'name', type: 'string', hidden},
            {
              name: 'nested',
              type: 'object',
              fields: [{name: 'nestedField', type: 'string', hidden}],
            },
          ],
        },
      ],
    })

    const schemaType = schema.get('example')
    if (!schemaType) throw new Error('No example schema type')

    const callbackResolver = createCallbackResolver(schemaType, 'hidden')
    const result = callbackResolver(
      {
        _id: 'some.id',
        _type: 'example',
        shouldHide: true,
      },
      exampleUser
    )

    expect(result).toEqual({
      children: {
        name: {value: true},
        nested: {
          children: {
            nestedField: {value: true},
          },
        },
      },
    })
  })

  it('preserves inner result nodes for fast immutable comparison', () => {
    const hidden = ({document}: any) => !!document?.shouldHide
    const stableHidden = ({document}: any) => document?._type === 'example'

    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'example',
          title: 'Example',
          type: 'document',
          fields: [
            {name: 'shouldHide', type: 'boolean'},
            {name: 'name', type: 'string', hidden},
            {
              name: 'resultShouldNotChange',
              type: 'string',
              hidden: stableHidden,
            },
            {
              name: 'nested',
              type: 'object',
              fields: [
                {
                  name: 'nestedResultShouldNotChange',
                  type: 'string',
                  hidden: stableHidden,
                },
              ],
            },
          ],
        },
      ],
    })

    const schemaType = schema.get('example')
    if (!schemaType) throw new Error('No example schema type')

    const callbackResolver = createCallbackResolver(schemaType, 'hidden')

    const doc0 = {
      _id: 'some.id',
      _type: 'example',
      shouldHide: false,
    }
    const doc1 = {
      ...doc0,
      shouldHide: true,
    }

    const result0 = callbackResolver(doc0, exampleUser)
    const result1 = callbackResolver(doc1, exampleUser)

    expect(result0).toEqual({
      children: {
        name: {value: false},
        nested: {
          children: {
            nestedResultShouldNotChange: {value: true},
          },
        },
        resultShouldNotChange: {value: true},
      },
    })

    expect(result1).toEqual({
      children: {
        name: {value: true},
        nested: {
          children: {
            nestedResultShouldNotChange: {value: true},
          },
        },
        resultShouldNotChange: {value: true},
      },
    })

    expect(result0).not.toBe(result1)
    expect(result0.children?.resultShouldNotChange).toBe(result1.children?.resultShouldNotChange)
    expect(result0.children?.nested).toBe(result1.children?.nested)
  })

  it.todo('tracks the paths the callback uses and only calls them when their dependencies change')
  it.todo('skips diffing nodes that no callbacks depending on')
  it.todo('works with callbacks with if statements in them')
  it.todo('works with arrays')
  it.todo('works with the current user')
})
