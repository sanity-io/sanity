// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import Schema from '@sanity/schema'
import {inputTester} from '../../../utils/tests/FormBuilderTester'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      title: 'Fieldsets test',
      name: 'fieldsetsTest',
      type: 'document',
      fieldsets: [
        /** Hidden fieldsets */
        {
          name: 'hiddenFieldsetBooleanTrue',
          hidden: true,
        },
        {
          name: 'hiddenFieldsetBooleanFalse',
          hidden: false,
        },
        {
          name: 'hiddenFieldsetCallbackTrue',
          hidden: ({document}) => document.isHidden === true,
        },
        {
          name: 'hiddenFieldsetCallbackFalse',
          hidden: ({document}) => document.isHidden === 'lorem',
        },
        /** Read only fieldsets */
        {
          name: 'readOnlyFieldsetBooleanTrue',
          readOnly: true,
        },
        {
          name: 'readOnlyFieldsetBooleanFalse',
          readOnly: false,
        },
        {
          name: 'readOnlyFieldsetCallbackTrue',
          readOnly: ({document}) => document.isReadOnly === true,
        },
        {
          name: 'readOnlyFieldsetCallbackFalse',
          readOnly: ({document}) => document.isReadOnly === 'lorem',
        },
      ],
      fields: [
        /** Hidden inputs */
        {
          name: 'hiddenFieldsetBooleanTrue1',
          type: 'string',
          fieldset: 'hiddenFieldsetBooleanTrue',
        },
        {
          name: 'hiddenFieldsetBooleanFalse1',
          type: 'string',
          fieldset: 'hiddenFieldsetBooleanFalse',
        },
        {
          name: 'hiddenFieldsetCallbackTrue1',
          type: 'string',
          fieldset: 'hiddenFieldsetCallbackTrue',
        },
        {
          name: 'hiddenFieldsetCallbackFalse1',
          type: 'string',
          fieldset: 'hiddenFieldsetCallbackFalse',
        },
        /** Read only inputs */
        {
          name: 'readOnlyFieldsetBooleanTrue1',
          type: 'string',
          fieldset: 'readOnlyFieldsetBooleanTrue',
        },
        {
          name: 'readOnlyFieldsetBooleanFalse1',
          type: 'string',
          fieldset: 'readOnlyFieldsetBooleanFalse',
        },
        {
          name: 'readOnlyFieldsetCallbackTrue1',
          type: 'string',
          fieldset: 'readOnlyFieldsetCallbackTrue',
        },
        {
          name: 'readOnlyFieldsetCallbackFalse1',
          type: 'string',
          fieldset: 'readOnlyFieldsetCallbackFalse',
        },
      ],
    },
  ],
})

const documentType = schema.get('fieldsetsTest')

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: '_id',
  _rev: '_rev',
  _type: '_type',
  _updatedAt: '2021-11-05T12:34:29Z',
  isReadOnly: true,
  isHidden: true,
}

function renderInput(testId: string) {
  return inputTester(dummyDocument, documentType, schema, testId)
}

describe('Fieldset with readOnly and hidden', () => {
  it('does not render because the hidden property is set to true', () => {
    const {inputContainer} = renderInput('fieldset-hiddenFieldsetBooleanTrue')
    expect(inputContainer).toBeNull()
  })

  it('does render because the hidden property is set to false', () => {
    const {inputContainer} = renderInput('fieldset-hiddenFieldsetBooleanFalse')
    expect(inputContainer).not.toBeNull()
  })

  it('does not render because the hidden property callback returns true', () => {
    const {inputContainer} = renderInput('fieldset-hiddenFieldsetCallbackTrue')
    expect(inputContainer).toBeNull()
  })

  it('does render because the hidden property callback returns false', () => {
    const {inputContainer} = renderInput('fieldset-hiddenFieldsetCallbackFalse')
    expect(inputContainer).not.toBeNull()
  })

  it('input in fieldset is read only because the fieldsets readOnly property is set to true', () => {
    const {inputContainer} = renderInput('fieldset-readOnlyFieldsetBooleanTrue')
    const input = inputContainer.querySelector('input')
    expect(input).toHaveAttribute('readonly')
  })

  it('input in fieldset is not read only because the fieldsets readOnly property is set to false', () => {
    const {inputContainer} = renderInput('fieldset-readOnlyFieldsetBooleanFalse')
    const input = inputContainer.querySelector('input')
    expect(input).not.toHaveAttribute('readonly')
  })

  it('input in fieldset is read only because the fieldsets readOnly property callback returns true', () => {
    const {inputContainer} = renderInput('fieldset-readOnlyFieldsetCallbackTrue')
    const input = inputContainer.querySelector('input')
    expect(input).toHaveAttribute('readonly')
  })

  it('input in fieldset is not read only because the fieldsets readOnly property callback returns false', () => {
    const {inputContainer} = renderInput('fieldset-readOnlyFieldsetCallbackFalse')
    const input = inputContainer.querySelector('input')
    expect(input).not.toHaveAttribute('readonly')
  })
})
