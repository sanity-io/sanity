import {defineType} from '@sanity/types'
import {fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {renderStringInput} from '../../../../../test/form'
import {DateTimeInput} from '../DateTimeInput'

// NOTE: for the tests to be deterministic we need this to ensure tests are run in a predefined timezone
// see globalSetup in jest config for details about how this is set up
test('timezone for the test environment should be set to America/Los_Angeles', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
})

test('does not emit onChange after invalid value has been typed', async () => {
  const {onChange, result} = await renderStringInput({
    fieldDefinition: defineType({
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
    fieldDefinition: defineType({
      type: 'datetime',
      name: 'test',
    }),
    render: (inputProps) => <DateTimeInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  // NOTE: the date is entered and displayed in local timezone
  // (which is hardcoded to America/Los_Angeles)
  userEvent.type(input, '2021-03-28 10:23')
  expect(input.value).toBe('2021-03-28 10:23')

  fireEvent.blur(input)

  // NOTE: the date is entered and displayed in local timezone but stored in utc
  expect(onChange.mock.calls).toMatchSnapshot()
})

test('formatting of deserialized value', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineType({
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
