// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import {render} from '@testing-library/react'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import Schema from '@sanity/schema'
import {FormBuilder} from '../form-builder'
import {requiredImageTypes} from '../test-utils'

/* 

  Question: 
  Should these tests instead check that the readOnly and hidden properties are resolved to booleans
  instead of testing all these inputs? Then testing the actual read-only and hidden functionality can
  be done in the tests for the specific input components instead.

*/

const callbackFn = jest.fn(() => true)
const readOnlyCallbackFn = jest.fn((b) => b)
const hiddenCallbackFn = jest.fn((b) => b)

const readOnlyCallbackFnDocumentTrue = jest.fn(({document}) =>
  Boolean(document?.readOnlyTestTitle === 'read only')
)
const readOnlyCallbackFnDocumentFalse = jest.fn(({document}) =>
  Boolean(document?.readOnlyTestTitle !== 'read only')
)

const hiddenCallbackFnDocumentTrue = jest.fn(({document}) =>
  Boolean(document?.hiddenTestTitle === 'hide me')
)
const hiddenCallbackFnDocumentFalse = jest.fn(({document}) =>
  Boolean(document?.hiddenTestTitle !== 'hide me')
)

const schema = Schema.compile({
  name: 'test',
  types: [
    ...requiredImageTypes,
    {
      name: 'book',
      type: 'document',
      fields: [
        {name: 'title', type: 'string', readOnly: callbackFn},
        {name: 'hidden', type: 'string', hidden: callbackFn},

        /* String fields with readOnly */
        {
          name: 'isReadOnly',
          type: 'string',
          readOnly: true,
        },
        {
          name: 'isNotReadOnly',
          type: 'string',
          readOnly: false,
        },
        {
          name: 'isReadOnlyCallback',
          type: 'string',
          readOnly: readOnlyCallbackFn(true),
        },
        {
          name: 'isNotReadOnlyCallback',
          type: 'string',
          readOnly: readOnlyCallbackFn(false),
        },
        {
          name: 'isReadOnlyWithDocument',
          type: 'string',
          readOnly: readOnlyCallbackFnDocumentTrue,
        },
        {
          name: 'isNotReadOnlyWithDocument',
          type: 'string',
          readOnly: readOnlyCallbackFnDocumentFalse,
        },

        /* String fields with hidden */
        {
          name: 'isHidden',
          type: 'string',
          hidden: true,
        },
        {
          name: 'isNotHidden',
          type: 'string',
          hidden: false,
        },
        {
          name: 'isHiddenCallback',
          type: 'string',
          hidden: hiddenCallbackFn(true),
        },
        {
          name: 'isNotHiddenCallback',
          type: 'string',
          hidden: hiddenCallbackFn(false),
        },
        {
          name: 'isHiddenWithDocument',
          type: 'string',
          hidden: hiddenCallbackFnDocumentTrue,
        },
        {
          name: 'isNotHiddenWithDocument',
          type: 'string',
          hidden: hiddenCallbackFnDocumentFalse,
        },
        /* Boolean field with readOnly */
        {
          name: 'readOnlyBoolean',
          type: 'boolean',
          readOnly: true,
        },
        /* Image and file fields with readOnly */
        {
          name: 'readOnlyImage',
          type: 'image',
          readOnly: readOnlyCallbackFn(true),
        },
        {
          name: 'readOnlyFile',
          type: 'file',
          readOnly: readOnlyCallbackFn(true),
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
  onFocus: jest.fn(),
  onBlur: jest.fn(),
  onChange: jest.fn(),
  markers: [],
  level: 0,
  presence: [],
}

const documentType = schema.get('book')

const FormBuilderTester = React.forwardRef(function FormBuilderTester() {
  const patchChannel = FormBuilder.createPatchChannel()
  return (
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <FormBuilder
            value={dummyDocument}
            schema={schema}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            patchChannel={patchChannel}
            filterField={() => true}
            type={documentType}
            {...DEFAULT_PROPS}
          />
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
})

describe('Form builder callback function', () => {
  it('readOnly and hidden callback function gets called', () => {
    render(<FormBuilderTester />)
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
            "value": undefined,
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
            "value": undefined,
          },
        ],
      ]
    `)
  })
})
// todo: move tests to the individual input components
// describe('String input fields with readOnly', () => {
//   it('makes field read-only with boolean', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isReadOnly').querySelector('input')).toHaveAttribute('readonly')
//   })

//   it('makes field read-only with callback', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isReadOnlyCallback').querySelector('input')).toHaveAttribute(
//       'readonly'
//     )
//   })

//   it('makes field read-only with callback using document value', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isReadOnlyWithDocument').querySelector('input')).toHaveAttribute(
//       'readonly'
//     )
//   })

//   it('makes field not read-only with callback', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isNotReadOnlyCallback').querySelector('input')).not.toHaveAttribute(
//       'readonly'
//     )
//   })

//   it('makes field not read-only with callback using document value', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(
//       queryByTestId('input-isNotReadOnlyWithDocument').querySelector('input')
//     ).not.toHaveAttribute('readonly')
//   })
// })

// describe('String input fields with hidden', () => {
//   it('hides field using boolean', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isHidden')).toBeNull()
//   })

//   it('hides field using callback', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isHiddenCallback')).toBeNull()
//     expect(queryByTestId('input-isNotHiddenCallback')).toBeDefined()
//   })

//   it('hides field using callback with document values', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isHiddenWithDocument')).toBeNull()
//   })

//   it('shows field using boolean', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isNotHidden')).toBeDefined()
//   })

//   it('shows field using callback', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isNotHiddenCallback')).toBeDefined()
//   })

//   it('shows field using callback with document values', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(queryByTestId('input-isNotHiddenWithDocument')).toBeDefined()
//   })
// })

// describe('Image fields with readOnly', () => {
//   it('makes empty image field read-only', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     const {getByText} = within(queryByTestId('input-readOnlyImage'))
//     expect(getByText('This field is read-only')).toBeDefined()
//   })
//   it(`hides populated image field's upload, remove, and select buttons`, () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(
//       within(queryByTestId('input-readOnlyImage')).queryByTestId('image-input-upload-button')
//     ).toBeNull()
//     expect(
//       within(queryByTestId('input-readOnlyImage')).queryByTestId('image-input-select-button')
//     ).toBeNull()
//     expect(
//       within(queryByTestId('input-readOnlyImage')).queryByTestId('image-input-remove-button')
//     ).toBeNull()
//   })
// })

// describe('File fields with readOnly', () => {
//   it('makes empty file field read-only', () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     const {getByText} = within(queryByTestId('input-readOnlyFile'))
//     expect(getByText('This field is read-only')).toBeDefined()
//   })
//   it(`hides populated file field's upload, remove, and select buttons`, () => {
//     const {queryByTestId} = render(<FormBuilderTester />)
//     expect(
//       within(queryByTestId('input-readOnlyFile')).queryByTestId('file-input-upload-button')
//     ).toBeNull()
//     expect(
//       within(queryByTestId('input-readOnlyFile')).queryByTestId('file-input-select-button')
//     ).toBeNull()
//     expect(
//       within(queryByTestId('input-readOnlyFile')).queryByTestId('file-input-remove-button')
//     ).toBeNull()
//   })
// })
