import {defineType} from '@sanity/types'
import React from 'react'
import {renderObjectInput} from '../../../../../test/form'
import {ObjectInput} from '../ObjectInput'

const fieldsetsTestType = defineType({
  title: 'Fieldsets test',
  name: 'fieldsetsTest',
  type: 'object',
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
      hidden: ({document}) => document?.isHidden === true,
    },
    {
      name: 'hiddenFieldsetCallbackFalse',
      hidden: ({document}) => document?.isHidden === 'lorem',
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
      readOnly: ({document}) => document?.isReadOnly === true,
    },
    {
      name: 'readOnlyFieldsetCallbackFalse',
      readOnly: ({document}) => document?.isReadOnly === 'lorem',
    },
  ],
  fields: [
    // Hidden inputs
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
    // Read only inputs
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
})

const dummyDocument = {
  _createdAt: '2021-11-04T15:41:48Z',
  _id: '_id',
  _rev: '_rev',
  _type: '_type',
  _updatedAt: '2021-11-05T12:34:29Z',
  isReadOnly: true,
  isHidden: true,
}

describe('Fieldset with readOnly and hidden', () => {
  it('does not render because the hidden property is set to true', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: fieldsetsTestType,
      props: {documentValue: dummyDocument},
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const inputContainer = result.queryByTestId('fieldset-hiddenFieldsetBooleanTrue')
    expect(inputContainer).toBeNull()
  })

  it('does render because the hidden property is set to false', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: fieldsetsTestType,
      props: {documentValue: dummyDocument},
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const inputContainer = result.queryByTestId('fieldset-hiddenFieldsetBooleanFalse')
    expect(inputContainer).not.toBeNull()
  })

  it('does not render because the hidden property callback returns true', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: fieldsetsTestType,
      props: {documentValue: dummyDocument},
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const inputContainer = result.queryByTestId('fieldset-hiddenFieldsetCallbackTrue')
    expect(inputContainer).toBeNull()
  })

  it('does render because the hidden property callback returns false', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: fieldsetsTestType,
      props: {documentValue: dummyDocument},
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const inputContainer = result.queryByTestId('fieldset-hiddenFieldsetCallbackFalse')
    expect(inputContainer).not.toBeNull()
  })

  it('input in fieldset is read only because the fieldsets readOnly property is set to true', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: fieldsetsTestType,
      props: {documentValue: dummyDocument},
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const inputContainer = result.queryByTestId('fieldset-readOnlyFieldsetBooleanTrue')
    const input = inputContainer!.querySelector('input')
    expect(input).toHaveAttribute('readonly')
  })

  it('input in fieldset is not read only because the fieldsets readOnly property is set to false', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: fieldsetsTestType,
      props: {documentValue: dummyDocument},
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const inputContainer = result.queryByTestId('fieldset-readOnlyFieldsetBooleanFalse')
    const input = inputContainer!.querySelector('input')
    expect(input).not.toHaveAttribute('readonly')
  })

  it('input in fieldset is read only because the fieldsets readOnly property callback returns true', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: fieldsetsTestType,
      props: {documentValue: dummyDocument},
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const inputContainer = result.queryByTestId('fieldset-readOnlyFieldsetCallbackTrue')
    const input = inputContainer!.querySelector('input')
    expect(input).toHaveAttribute('readonly')
  })

  it('input in fieldset is not read only because the fieldsets readOnly property callback returns false', async () => {
    const {result} = await renderObjectInput({
      fieldDefinition: fieldsetsTestType,
      props: {documentValue: dummyDocument},
      render: (inputProps) => <ObjectInput {...inputProps} />,
    })

    const inputContainer = result.queryByTestId('fieldset-readOnlyFieldsetCallbackFalse')
    const input = inputContainer!.querySelector('input')
    expect(input).not.toHaveAttribute('readonly')
  })
})
