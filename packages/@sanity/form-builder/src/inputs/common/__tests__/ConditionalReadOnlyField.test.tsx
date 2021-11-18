// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React, {MutableRefObject} from 'react'
import {render} from '@testing-library/react'
import Schema from '@sanity/schema'
import {ConditionalReadOnlyField} from '../ConditionalReadOnlyField'
import SanityFormBuilderContext from '../../../sanity/SanityFormBuilderContext'
import FormBuilder from '../../../sanity/SanityFormBuilder'

const callbackFn = jest.fn(() => true)
const readOnlyCallbackFn = jest.fn((b) => b)

const readOnlyCallbackFnDocumentTrue = jest.fn(({document}) =>
  Boolean(document?.readOnlyTestTitle === 'read only')
)
const readOnlyCallbackFnDocumentFalse = jest.fn(({document}) =>
  Boolean(document?.readOnlyTestTitle !== 'read only')
)

// Empty schema to pass to the context
const schema = Schema.compile({
  name: 'test',
  types: [],
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

const DEFAULT_PROPS = {
  checkPropertyKey: 'testKey',
  document: dummyDocument,
  value: undefined,
  parent: {
    parentTest: 'hello',
  },
}

interface ConditionalFieldsTesterProps {
  readOnly?: any
}

const DummyPropsComponent = React.forwardRef(function DummyPropsComponent(
  props: Partial<ConditionalFieldsTesterProps>,
  ref: MutableRefObject<HTMLDivElement>
) {
  return <div ref={ref} data-testid="dummy" data-read-only={props.readOnly ? true : undefined} />
})

const ConditionalFieldsTester = React.forwardRef(function ConditionalFieldsTester(
  props: Partial<ConditionalFieldsTesterProps>,
  ref: MutableRefObject<HTMLDivElement>
) {
  const patchChannel = FormBuilder.createPatchChannel()

  return (
    <SanityFormBuilderContext
      value={DEFAULT_PROPS.value}
      schema={schema}
      patchChannel={patchChannel}
    >
      <ConditionalReadOnlyField {...DEFAULT_PROPS} readOnly={props.readOnly}>
        <DummyPropsComponent ref={ref} />
      </ConditionalReadOnlyField>
    </SanityFormBuilderContext>
  )
})

describe('Conditional Read Only Callback', () => {
  it('readOnly callback function gets called', () => {
    render(<ConditionalFieldsTester readOnly={callbackFn} />)
    expect(callbackFn).toBeCalled()
    expect(callbackFn.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "currentUser": null,
      "document": Object {
        "_createdAt": "2021-11-04T15:41:48Z",
        "_id": "drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a",
        "_rev": "5hb8s6-k75-ip4-4bq-5ztbf3fbx",
        "_type": "conditionalFieldsTest",
        "_updatedAt": "2021-11-05T12:34:29Z",
        "fieldWithObjectType": Object {
          "field1": "dqwdw",
          "field2": "vdsvdsvdsnkjnjkk",
          "roleConditionField": "dvsvd",
        },
        "hiddenTestTitle": "hide me",
        "isPublished": true,
        "readOnlyIfTitleIsReadOnly": "dweefbfdssnflewnfklfwnlekfss",
        "readOnlyTestTitle": "read only",
      },
      "parent": Object {
        "parentTest": "hello",
      },
      "value": undefined,
    },
  ],
]
`)
  })
})

describe('Conditional Read Only component', () => {
  it('makes field read-only with boolean', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester readOnly />)
    expect(queryByTestId('dummy')).toHaveAttribute('data-read-only')
  })

  it('makes field read-only with callback', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester readOnly={callbackFn} />)
    expect(queryByTestId('dummy')).toHaveAttribute('data-read-only')
  })

  it('makes field read-only with callback using document value', () => {
    const {queryByTestId} = render(
      <ConditionalFieldsTester readOnly={readOnlyCallbackFnDocumentTrue} />
    )
    expect(queryByTestId('dummy')).toHaveAttribute('data-read-only')
  })

  it('makes field not read-only with boolean', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester readOnly={false} />)
    expect(queryByTestId('dummy')).not.toHaveAttribute('data-read-only')
  })

  it('makes field not read-only with callback', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester readOnly={readOnlyCallbackFn(false)} />)
    expect(queryByTestId('dummy')).not.toHaveAttribute('data-read-only')
  })

  it('makes field not read-only with callback using document value', () => {
    const {queryByTestId} = render(
      <ConditionalFieldsTester readOnly={readOnlyCallbackFnDocumentFalse} />
    )
    expect(queryByTestId('dummy')).not.toHaveAttribute('data-read-only')
  })
})
