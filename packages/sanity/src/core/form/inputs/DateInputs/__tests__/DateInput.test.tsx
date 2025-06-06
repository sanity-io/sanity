import {defineField} from '@sanity/types'
import {fireEvent} from '@testing-library/react'
import {expect, test} from 'vitest'

import {renderStringInput} from '../../../../../../test/form'
import {DateInput} from '../DateInput'

// NOTE: for the tests to be deterministic we need this to ensure tests are run in a predefined time zone
// see globalSetup in jest config for details about how this is set up
test('time zone for the test environment should be set to America/Los_Angeles', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
})

test('does not emit onChange after invalid value has been typed', async () => {
  const {onChange, result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'date',
      name: 'test',
    }),
    render: (inputProps) => <DateInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  fireEvent.change(input, {target: {value: 'this is invalid'}})
  expect(input.value).toBe('this is invalid')
  expect(onChange.mock.calls.length).toBe(0)

  fireEvent.blur(input)

  expect(onChange.mock.calls.length).toBe(0)
})

test('emits onChange on correct format if a valid value has been typed', async () => {
  const {onChange, result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'date',
      name: 'test',
    }),
    render: (inputProps) => <DateInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  // NOTE: the date is entered and displayed in local time zone
  fireEvent.change(input, {target: {value: '2021-03-28'}})
  expect(input.value).toBe('2021-03-28')

  fireEvent.blur(input)

  // NOTE: the date is entered and displayed in local time zone but stored in utc
  expect(onChange.mock.calls).toMatchSnapshot()
})

test('formatting of deserialized value', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'date',
      name: 'test',
    }),
    props: {documentValue: {test: '2021-03-28'}},
    render: (inputProps) => <DateInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  // const {textInput} = renderInput({value: '2021-03-28'} as any)
  expect(input.value).toBe('2021-03-28')
})

test('change the date should show the correct date in the input (save on enter)', async () => {
  const {onChange, result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'date',
      name: 'test',
    }),
    props: {documentValue: {test: '2021-03-28'}},
    render: (inputProps) => <DateInput {...inputProps} />,
  })

  const input = result.container.querySelector('input')!
  fireEvent.change(input, {target: {value: '2021-03-30'}})
  fireEvent.blur(input)
  expect(onChange.mock.calls).toMatchSnapshot()
})
