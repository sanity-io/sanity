import {fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {format, parse} from 'date-fns'
import React from 'react'
import {defineField} from '@sanity/types'
import {ParseResult} from '../types'
import {CommonDateTimeInput} from '../CommonDateTimeInput'
import {isValidDate} from '../utils'
import {renderStringInput} from '../../../../../../test/form'

function parseInputValue(input: string): ParseResult {
  const candidate = parse(input, 'yyyy-MM-dd HH:mm', 0)
  if (isValidDate(candidate)) return {isValid: true, date: candidate}
  return {isValid: false, error: `Invalid date string: ${input}`}
}

function formatInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm')
}

function deserialize(value: string): ParseResult {
  const deserialized = new Date(value)
  if (isValidDate(deserialized)) return {isValid: true, date: deserialized}
  return {isValid: false, error: `Invalid date string: ${value}`}
}

function serialize(date: Date): string {
  return date.toISOString()
}

async function renderInput() {
  const onChange = jest.fn()

  const ret = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
    }),
    render: (props) => {
      const {id, readOnly = false, value} = props

      return (
        <CommonDateTimeInput
          deserialize={deserialize}
          id={id}
          formatInputValue={formatInputValue}
          onChange={onChange}
          parseInputValue={parseInputValue}
          readOnly={readOnly}
          serialize={serialize}
          value={value}
        />
      )
    },
  })

  return {...ret, onChange}
}

// NOTE: for the tests to be deterministic we need this to ensure tests are run in a predefined timezone
// see globalSetup in jest config for details about how this is set up
test('timezone for the test environment should be set to America/Los_Angeles', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
})

test('does not emit onChange after invalid value has been typed', async () => {
  const {result, onChange} = await renderInput()
  const input = result.container.querySelector('input')!

  userEvent.type(input, 'this is invalid')
  expect(input.value).toBe('this is invalid')
  expect(onChange.mock.calls.length).toBe(0)

  fireEvent.blur(input)

  expect(onChange.mock.calls.length).toBe(0)
})

test('emits onChange on correct format if a valid value has been typed', async () => {
  const {result, onChange} = await renderInput()
  const input = result.container.querySelector('input')!

  // NOTE: the date is entered and displayed in local timezone (which is hardcoded to America/Los_Angeles)
  userEvent.type(input, '2021-03-28 10:23')
  expect(input?.value).toBe('2021-03-28 10:23')

  fireEvent.blur(input)

  // NOTE: the date is entered and displayed in local timezone but stored in utc
  expect(onChange.mock.calls).toEqual([['2021-03-28T17:23:00.000Z']])
})
