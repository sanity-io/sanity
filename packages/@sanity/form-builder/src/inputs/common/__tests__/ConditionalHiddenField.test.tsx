// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React, {MutableRefObject} from 'react'
import {render} from '@testing-library/react'
import Schema from '@sanity/schema'
import {ConditionalHiddenField} from '../ConditionalHiddenField'
import SanityFormBuilderContext from '../../../sanity/SanityFormBuilderContext'
import FormBuilder from '../../../sanity/SanityFormBuilder'

const callbackFn = jest.fn(() => true)
const hiddenCallback = jest.fn((b) => b)

const hiddenCallbackDocumentTrue = jest.fn(({document}) =>
  Boolean(document?.hiddenTestTitle === 'hide me')
)
const hiddenCallbackDocumentFalse = jest.fn(({document}) =>
  Boolean(document?.hiddenTestTitle !== 'hide me')
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
  hiddenIfTitleIsHidden: 'dweefbfdssnflewnfklfwnlekfss',
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
  hidden?: any
}

const DummyPropsComponent = function DummyPropsComponent() {
  return <div data-testid="dummy" />
}

const ConditionalFieldsTester = function ConditionalFieldsTester(
  props: Partial<ConditionalFieldsTesterProps>
) {
  const patchChannel = FormBuilder.createPatchChannel()

  return (
    <SanityFormBuilderContext
      value={DEFAULT_PROPS.value}
      schema={schema}
      patchChannel={patchChannel}
    >
      <ConditionalHiddenField {...DEFAULT_PROPS} hidden={props.hidden}>
        <DummyPropsComponent />
      </ConditionalHiddenField>
    </SanityFormBuilderContext>
  )
}

describe('Conditional Hidden Callback', () => {
  it('hidden callback function gets called', () => {
    render(<ConditionalFieldsTester hidden={callbackFn} />)
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
        "hiddenIfTitleIsHidden": "dweefbfdssnflewnfklfwnlekfss",
        "hiddenTestTitle": "hide me",
        "isPublished": true,
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

describe('Conditional Hidden component', () => {
  it('makes field hidden with boolean', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester hidden />)
    expect(queryByTestId('dummy')).toBeNull()
  })

  it('makes field hidden with callback', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester hidden={callbackFn} />)
    expect(queryByTestId('dummy')).toBeNull()
  })

  it('makes field hidden with callback using document value', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester hidden={hiddenCallbackDocumentTrue} />)
    expect(queryByTestId('dummy')).toBeNull()
  })

  it('makes field not hidden with boolean', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester hidden={false} />)
    expect(queryByTestId('dummy')).not.toBeNull()
  })

  it('makes field not hidden with callback', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester hidden={hiddenCallback(false)} />)
    expect(queryByTestId('dummy')).not.toBeNull()
  })

  it('makes field not hidden with callback using document value', () => {
    const {queryByTestId} = render(<ConditionalFieldsTester hidden={hiddenCallbackDocumentFalse} />)
    expect(queryByTestId('dummy')).not.toBeNull()
  })
})
