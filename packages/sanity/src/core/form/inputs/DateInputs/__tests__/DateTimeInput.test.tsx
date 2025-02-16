import {defineField} from '@sanity/types'
import {fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, test} from 'vitest'

import {renderStringInput} from '../../../../../../test/form'
import {DateTimeInput} from '../DateTimeInput'

// NOTE: for the tests to be deterministic we need this to ensure tests are run in a predefined time zone
// see globalSetup in jest config for details about how this is set up
test('time zone for the test environment should be set to America/Los_Angeles', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
})

test('does not emit onChange after invalid value has been typed', async () => {
  const {onChange, result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
    }),
    render: (inputProps) => <DateTimeInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  userEvent.type(input, 'this is invalid')
  expect(input.value).toBe('this is invalid')
  expect(onChange.mock.calls.length).toBe(0)

  fireEvent.blur(input)

  expect(onChange.mock.calls.length).toBe(0)
})

test('emits onChange on correct format if a valid value has been typed', async () => {
  const {onChange, result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
    }),
    render: (inputProps) => <DateTimeInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  // NOTE: the date is entered and displayed in local time zone
  // (which is hardcoded to America/Los_Angeles)
  userEvent.type(input, '2021-03-28 10:23')
  expect(input.value).toBe('2021-03-28 10:23')

  fireEvent.blur(input)

  // NOTE: the date is entered and displayed in local time zone but stored in utc
  expect(onChange.mock.calls).toMatchSnapshot()
})

test('formatting of deserialized value', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
    }),
    props: {documentValue: {test: '2021-03-28T17:23:00.000Z'}},
    render: (inputProps) => <DateTimeInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  // const {textInput} = renderInput({value: '2021-03-28T17:23:00.000Z'} as any)
  expect(input.value).toBe('2021-03-28 10:23')
})

test('time is shown in the display time zone if specified (utc+1 winter)', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
      options: {displayTimeZone: 'Europe/Oslo'},
    }),
    props: {documentValue: {test: '2021-01-15T12:00:00.000Z'}},
    render: (inputProps) => <DateTimeInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  expect(input.value).toBe('2021-01-15 13:00')
})

test('time is shown in the display time zone if specified (utc+2 summer)', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
      options: {displayTimeZone: 'Europe/Oslo'},
    }),
    props: {documentValue: {test: '2021-06-15T12:00:00.000Z'}},
    render: (inputProps) => <DateTimeInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  expect(input.value).toBe('2021-06-15 14:00')
})

test('the time zone can be changed by the user if allowed', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
      options: {displayTimeZone: 'Europe/Oslo', allowTimeZoneSwitch: true},
    }),
    props: {documentValue: {test: '2021-06-15T12:00:00.000Z'}},
    render: (inputProps) => <DateTimeInput {...inputProps} />,
  })

  // click on the TimeZoneButton
  const timeZoneButton = result.getByLabelText('GMT+1')
  userEvent.click(timeZoneButton)
  // ensure the dialog shows
  expect(result.getByText('Select time zone')).toBeInTheDocument()
})

test('the time zone can not be changed by the user if not allowed', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
      options: {displayTimeZone: 'Europe/Oslo', allowTimeZoneSwitch: false},
    }),
    props: {documentValue: {test: '2021-06-15T12:00:00.000Z'}},
    render: (inputProps) => <DateTimeInput {...inputProps} />,
  })

  const timeZoneText = result.getByLabelText('GMT+1')
  userEvent.click(timeZoneText)

  expect(result.getByText('Select time zone')).not.toBeInTheDocument()
})
