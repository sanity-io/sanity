import React from 'react'
import {renderNode} from '../../../test/renderNode'
import {ConditionalHiddenField, ConditionalHiddenFieldProps} from '../ConditionalHiddenField'

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

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'conditionalFieldsTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  fieldWithObjectType: {
    field1: 'dqwdw',
    field2: 'vdsvdsvdsnkjnjkk',
    roleConditionField: 'dvsvd',
  },
  isPublished: true,
  hiddenIfTitleIsHidden: 'dweefbfdssnflewnfklfwnlekfss',
  hiddenTestTitle: 'hide me',
}

const testType = {
  type: 'document',
  name: 'test',
  title: 'Test',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
  ],
}

function render(
  props: Partial<
    ConditionalHiddenFieldProps & {
      // @todo: this should be typed as part of `ConditionalHiddenFieldProps`
      checkPropertyKey?: string
      // @todo: this should be typed as part of `ConditionalHiddenFieldProps`
      document?: any
    }
  >
) {
  return renderNode({
    render: ({type, ...restProps}) => (
      <ConditionalHiddenField
        {...restProps}
        checkPropertyKey="testKey"
        document={dummyDocument}
        value={undefined}
        parent={{
          parentTest: 'hello',
        }}
        {...props}
      >
        <div data-testid="dummy" />
      </ConditionalHiddenField>
    ),
    type: testType,
  })
}

describe('Conditional Hidden Callback', () => {
  it('hidden callback function gets called', () => {
    const hiddenFn = jest.fn(() => true)
    render({hidden: hiddenFn})
    expect(hiddenFn).toBeCalled()
    expect(hiddenFn.mock.calls).toMatchSnapshot()
  })
})

describe('Conditional Hidden component', () => {
  it('makes field hidden with boolean', () => {
    const {result} = render({hidden: true})
    expect(result.queryByTestId('dummy')).toBeNull()
  })

  it('makes field hidden with callback', () => {
    const hiddenFn = jest.fn(() => true)
    const {result} = render({hidden: hiddenFn})
    expect(result.queryByTestId('dummy')).toBeNull()
  })

  it('makes field hidden with callback using document value', () => {
    const hiddenCallbackDocumentTrue = jest.fn(({document}) =>
      Boolean(document?.hiddenTestTitle === 'hide me')
    )
    const {result} = render({hidden: hiddenCallbackDocumentTrue})
    expect(result.queryByTestId('dummy')).toBeNull()
  })

  it('makes field not hidden with boolean', () => {
    const {result} = render({hidden: false})
    expect(result.queryByTestId('dummy')).not.toBeNull()
  })

  it('makes field not hidden with callback', () => {
    const hiddenCallback = jest.fn((b) => b)
    const {result} = render({hidden: hiddenCallback(false)})
    expect(result.queryByTestId('dummy')).not.toBeNull()
  })

  it('makes field not hidden with callback using document value', () => {
    const hiddenCallbackDocumentFalse = jest.fn(({document}) =>
      Boolean(document?.hiddenTestTitle !== 'hide me')
    )
    const {result} = render({hidden: hiddenCallbackDocumentFalse})
    expect(result.queryByTestId('dummy')).not.toBeNull()
  })
})
