import {renderForm} from '../../test/renderForm'

// This mock is needed to prevent the "not wrapped in act()" error from React testing library.
// The reason is that the `useCurrentUser` is used by `ObjectInput` to figure out which fields are
// hidden, and using this hook causes the `ObjectInput` to render again once the user is loaded.
//
// NOTE!
// We can remove this mock when `ObjectInput` no longer uses `useCurrentUser`.
jest.mock('@sanity/base/hooks', () => {
  const hooks = jest.requireActual('@sanity/base/hooks')

  return {
    ...hooks,
    useCurrentUser: jest.fn().mockImplementation(() => ({
      value: null,
      error: null,
      isLoading: false,
    })),
  }
})

describe('Form builder callback function', () => {
  it('readOnly and hidden callback functions are called', () => {
    const callbackFn = jest.fn(() => false)
    const callbackFnDocument = jest.fn(({document}) =>
      Boolean(document?.readOnlyTestTitle === 'read only')
    )

    renderForm({
      type: {
        name: 'book',
        type: 'document',
        fields: [
          {name: 'title', type: 'string', readOnly: callbackFn},
          {name: 'hidden', type: 'string', hidden: callbackFnDocument},
          {
            name: 'readonly',
            type: 'object',
            readOnly: callbackFn,
            fields: [
              {name: 'field1', title: 'Field 1', type: 'string', hidden: callbackFnDocument},
            ],
          },
        ],
      },
      value: {
        _createdAt: '2021-11-04T15:41:48Z',
        _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
        _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
        _type: 'conditionalFieldsTest',
        _updatedAt: '2021-11-05T12:34:29Z',
        title: 'Hello world',
        hidden: '',
      },
    })

    expect(callbackFn).toBeCalledTimes(2)
    expect(callbackFnDocument).toBeCalledTimes(2)
    expect(callbackFn.mock.calls).toMatchSnapshot()
  })
})
