import {useConditionalReadOnly} from '@sanity/base/_internal'
import React, {MutableRefObject} from 'react'
import {renderNode} from '../../../../test/renderNode'
import {ConditionalReadOnlyField, ConditionalReadOnlyFieldProps} from '../conditionalReadOnly'

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
  readOnlyIfTitleIsReadOnly: 'dweefbfdssnflewnfklfwnlekfss',
  readOnlyTestTitle: 'read only',
  hiddenTestTitle: 'hide me',
}

const DummyPropsComponent = React.forwardRef(function DummyPropsComponent(
  _props: Record<string, unknown>,
  ref: MutableRefObject<HTMLDivElement>
) {
  const conditionalReadOnly = useConditionalReadOnly()
  return (
    <div ref={ref} data-testid="dummy" data-read-only={conditionalReadOnly ? true : undefined} />
  )
})

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
    ConditionalReadOnlyFieldProps & {
      // @todo: this should be typed as part of `ConditionalReadOnlyFieldProps`
      checkPropertyKey?: string
      // @todo: this should be typed as part of `ConditionalReadOnlyFieldProps`
      document?: any
    }
  >
) {
  return renderNode({
    render: ({type, ...restProps}) => (
      <ConditionalReadOnlyField
        {...restProps}
        checkPropertyKey="testKey"
        document={dummyDocument}
        value={undefined}
        parent={{
          parentTest: 'hello',
        }}
        {...props}
      >
        <DummyPropsComponent />
      </ConditionalReadOnlyField>
    ),
    type: testType,
  })
}

describe('Conditional Read Only Callback', () => {
  it('readOnly callback function gets called', () => {
    const callbackFn = jest.fn(() => true)
    // render(<ConditionalFieldsTester readOnly={callbackFn} />)
    render({readOnly: callbackFn})
    expect(callbackFn).toBeCalled()
    expect(callbackFn.mock.calls).toMatchSnapshot()
  })
})

describe('Conditional Read Only component', () => {
  it('makes field read-only with boolean', () => {
    const {result} = render({readOnly: true})
    // const {queryByTestId} = render(<ConditionalFieldsTester readOnly />)
    expect(result.queryByTestId('dummy')).toHaveAttribute('data-read-only')
  })

  it('makes field read-only with callback', () => {
    const callbackFn = jest.fn(() => true)
    // const {queryByTestId} = render(<ConditionalFieldsTester readOnly={callbackFn} />)
    const {result} = render({readOnly: callbackFn})
    expect(result.queryByTestId('dummy')).toHaveAttribute('data-read-only')
  })

  it('makes field read-only with callback using document value', () => {
    // const {queryByTestId} = render(
    //   <ConditionalFieldsTester readOnly={readOnlyCallbackFnDocumentTrue} />
    // )
    const readOnlyCallbackFnDocumentTrue = jest.fn(({document}) =>
      Boolean(document?.readOnlyTestTitle === 'read only')
    )
    const {result} = render({readOnly: readOnlyCallbackFnDocumentTrue})
    expect(result.queryByTestId('dummy')).toHaveAttribute('data-read-only')
  })

  it('makes field not read-only with boolean', () => {
    // const {queryByTestId} = render(<ConditionalFieldsTester readOnly={false} />)
    const {result} = render({readOnly: false})
    expect(result.queryByTestId('dummy')).not.toHaveAttribute('data-read-only')
  })

  it('makes field not read-only with callback', () => {
    // const {queryByTestId} = render(<ConditionalFieldsTester readOnly={readOnlyCallbackFn(false)} />)
    const readOnlyCallbackFn = jest.fn((b) => b)
    const {result} = render({readOnly: readOnlyCallbackFn(false)})
    expect(result.queryByTestId('dummy')).not.toHaveAttribute('data-read-only')
  })

  it('makes field not read-only with callback using document value', () => {
    // const {queryByTestId} = render(
    //   <ConditionalFieldsTester readOnly={readOnlyCallbackFnDocumentFalse} />
    // )
    const readOnlyCallbackFnDocumentFalse = jest.fn(({document}) =>
      Boolean(document?.readOnlyTestTitle !== 'read only')
    )
    const {result} = render({readOnly: readOnlyCallbackFnDocumentFalse})
    expect(result.queryByTestId('dummy')).not.toHaveAttribute('data-read-only')
  })
})
