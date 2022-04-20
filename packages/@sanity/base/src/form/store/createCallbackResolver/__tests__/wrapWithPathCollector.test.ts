import {wrapWithPathCollector} from '../wrapWithPathCollector'

const exampleUser = {
  email: 'person@example.com',
  id: 'personId',
  name: 'person',
  roles: [{name: 'admin', title: 'Role Title'}],
}

describe('wrapWithPathCollector', () => {
  it('wraps conditional callbacks with a function that tracks the paths touched', () => {
    const wrappedCallback = wrapWithPathCollector({
      callback: ({document}) => !!document?.shouldHide,
      path: ['foo'],
    })

    const [result, touchedPaths] = wrappedCallback({
      document: {_id: 'some.id', _type: 'example', shouldHide: true},
      currentUser: exampleUser,
    })

    expect(result).toBe(true)
    expect(touchedPaths).toEqual({document: {shouldHide: {}}})
  })

  it('correctly grabs and tracks the `value`, `parent`, `document` and `currentUser`', () => {
    const wrappedCallback = wrapWithPathCollector({
      callback: ({document, parent, currentUser, value}) =>
        Boolean(parent?.foo) &&
        Boolean(document?.bar) &&
        Boolean(currentUser.roles.find((role) => role.name === 'admin')) &&
        Boolean(value?.nested),
      path: ['example', 'path'],
    })

    const [result, touchedPaths] = wrappedCallback({
      document: {
        _id: 'some.id',
        _type: 'example',
        example: {foo: true, path: {nested: 'string'}},
        bar: true,
      },
      currentUser: exampleUser,
    })

    expect(result).toBe(true)
    expect(touchedPaths).toEqual({
      // comes from `currentUser.roles.find((role) => role.name === 'admin')`
      currentUser: {
        roles: {'0': {name: {}}, length: {}},
      },
      document: {
        // comes from `document?.bar`
        bar: {},
        example: {
          // comes from `parent?.foo`
          foo: {},
          // comes from `value?.nested`
          path: {nested: {}},
        },
      },
    })
  })
})
