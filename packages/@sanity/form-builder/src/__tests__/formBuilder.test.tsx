// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import {render} from '@testing-library/react'
import Schema from '@sanity/schema'
import {DEFAULT_PROPS, FormBuilderTester} from '../utils/tests/FormBuilderTester'

const callbackFn = jest.fn(() => false)
const callbackFnDocument = jest.fn(({document}) =>
  Boolean(document?.readOnlyTestTitle === 'read only')
)

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      name: 'book',
      type: 'document',
      fields: [
        {name: 'title', type: 'string', readOnly: callbackFn},
        {name: 'hidden', type: 'string', hidden: callbackFnDocument},
        {
          name: 'readonly',
          type: 'object',
          readOnly: callbackFn,
          fields: [{name: 'field1', title: 'Field 1', type: 'string', hidden: callbackFnDocument}],
        },
      ],
    },
  ],
})

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: 'drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  _type: 'conditionalFieldsTest',
  _updatedAt: '2021-11-05T12:34:29Z',
  title: 'Hello world',
  hidden: '',
}

const documentType = schema.get('book')
const onChange = jest.fn()
const onFocus = jest.fn()
const onBlur = jest.fn()

const FormBuilder = () => (
  <FormBuilderTester
    {...DEFAULT_PROPS}
    type={documentType}
    schema={schema}
    value={dummyDocument}
    onBlur={onBlur}
    onFocus={onFocus}
    onChange={onChange}
  />
)

describe('Form builder callback function', () => {
  it('readOnly and hidden callback functions are called', () => {
    render(<FormBuilder />)
    expect(callbackFn).toBeCalledTimes(2)
    expect(callbackFnDocument).toBeCalledTimes(2)
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
              "hidden": "",
              "title": "Hello world",
            },
            "parent": Object {
              "_createdAt": "2021-11-04T15:41:48Z",
              "_id": "drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a",
              "_rev": "5hb8s6-k75-ip4-4bq-5ztbf3fbx",
              "_type": "conditionalFieldsTest",
              "_updatedAt": "2021-11-05T12:34:29Z",
              "hidden": "",
              "title": "Hello world",
            },
            "value": "Hello world",
          },
        ],
        Array [
          Object {
            "currentUser": null,
            "document": Object {
              "_createdAt": "2021-11-04T15:41:48Z",
              "_id": "drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a",
              "_rev": "5hb8s6-k75-ip4-4bq-5ztbf3fbx",
              "_type": "conditionalFieldsTest",
              "_updatedAt": "2021-11-05T12:34:29Z",
              "hidden": "",
              "title": "Hello world",
            },
            "parent": Object {
              "_createdAt": "2021-11-04T15:41:48Z",
              "_id": "drafts.10053a07-8647-4ebd-9d1d-33a512d30d3a",
              "_rev": "5hb8s6-k75-ip4-4bq-5ztbf3fbx",
              "_type": "conditionalFieldsTest",
              "_updatedAt": "2021-11-05T12:34:29Z",
              "hidden": "",
              "title": "Hello world",
            },
            "value": undefined,
          },
        ],
      ]
    `)
  })
})
