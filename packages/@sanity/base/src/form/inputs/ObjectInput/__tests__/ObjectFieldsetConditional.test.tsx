// This mock is needed to prevent the "not wrapped in act()" error from React testing library.
// The reason is that the `useCurrentUser` is used by `ObjectInput` to figure out which fields are
// hidden, and using this hook causes the `ObjectInput` to render again once the user is loaded.
//
// NOTE!

import {renderForm} from '../../../test/renderForm'

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

// Spy `console.warn` to prevent warnings from showing in the test output
const _consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

const fieldsetsTestType = {
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
      hidden: ({document}: any) => document.isHidden === true,
    },
    {
      name: 'hiddenFieldsetCallbackFalse',
      hidden: ({document}: any) => document.isHidden === 'lorem',
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
      readOnly: ({document}: any) => document.isReadOnly === true,
    },
    {
      name: 'readOnlyFieldsetCallbackFalse',
      readOnly: ({document}: any) => document.isReadOnly === 'lorem',
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
}

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
  it('does not render because the hidden property is set to true', () => {
    const {result} = renderForm({type: fieldsetsTestType, value: dummyDocument})
    const inputContainer = result.queryByTestId('fieldset-hiddenFieldsetBooleanTrue')
    expect(inputContainer).toBeNull()
  })

  it('does render because the hidden property is set to false', () => {
    const {result} = renderForm({type: fieldsetsTestType, value: dummyDocument})
    const inputContainer = result.queryByTestId('fieldset-hiddenFieldsetBooleanFalse')
    expect(inputContainer).not.toBeNull()
  })

  it('does not render because the hidden property callback returns true', () => {
    const {result} = renderForm({type: fieldsetsTestType, value: dummyDocument})
    const inputContainer = result.queryByTestId('fieldset-hiddenFieldsetCallbackTrue')
    expect(inputContainer).toBeNull()
  })

  it('does render because the hidden property callback returns false', () => {
    const {result} = renderForm({type: fieldsetsTestType, value: dummyDocument})
    const inputContainer = result.queryByTestId('fieldset-hiddenFieldsetCallbackFalse')
    expect(inputContainer).not.toBeNull()
  })

  it('input in fieldset is read only because the fieldsets readOnly property is set to true', () => {
    const {result} = renderForm({type: fieldsetsTestType, value: dummyDocument})
    const inputContainer = result.queryByTestId('fieldset-readOnlyFieldsetBooleanTrue')
    const input = inputContainer!.querySelector('input')
    expect(input).toHaveAttribute('readonly')
  })

  it('input in fieldset is not read only because the fieldsets readOnly property is set to false', () => {
    const {result} = renderForm({type: fieldsetsTestType, value: dummyDocument})
    const inputContainer = result.queryByTestId('fieldset-readOnlyFieldsetBooleanFalse')
    const input = inputContainer!.querySelector('input')
    expect(input).not.toHaveAttribute('readonly')
  })

  it('input in fieldset is read only because the fieldsets readOnly property callback returns true', () => {
    const {result} = renderForm({type: fieldsetsTestType, value: dummyDocument})
    const inputContainer = result.queryByTestId('fieldset-readOnlyFieldsetCallbackTrue')
    const input = inputContainer!.querySelector('input')
    expect(input).toHaveAttribute('readonly')
  })

  it('input in fieldset is not read only because the fieldsets readOnly property callback returns false', () => {
    const {result} = renderForm({type: fieldsetsTestType, value: dummyDocument})
    const inputContainer = result.queryByTestId('fieldset-readOnlyFieldsetCallbackFalse')
    const input = inputContainer!.querySelector('input')
    expect(input).not.toHaveAttribute('readonly')
  })
})
