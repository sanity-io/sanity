import {fireEvent, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {format, parse} from 'date-fns'
import React from 'react'
import {LayerProvider, ThemeProvider, studioTheme} from '@sanity/ui'
import {ParseResult} from '../types'
import {CommonDateTimeInput} from '../CommonDateTimeInput'
import {isValidDate} from '../utils'

const parseInputValue = (input: string): ParseResult => {
  const candidate = parse(input, 'yyyy-MM-dd HH:mm', 0)
  if (isValidDate(candidate)) {
    return {isValid: true, date: candidate}
  }
  return {isValid: false, error: `Invalid date string: ${input}`}
}

const formatInputValue = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm')
}

const deserialize = (value: string): ParseResult => {
  const deserialized = new Date(value)
  if (isValidDate(deserialized)) {
    return {isValid: true, date: deserialized}
  }
  return {isValid: false, error: `Invalid date string: ${value}`}
}

const serialize = (date: Date): string => {
  return date.toISOString()
}

function renderInput() {
  const onFocus = jest.fn()
  const onChange = jest.fn()

  const {container} = render(
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <CommonDateTimeInput
          deserialize={deserialize}
          formatInputValue={formatInputValue}
          id="test"
          onChange={onChange}
          parseInputValue={parseInputValue}
          readOnly={false}
          serialize={serialize}
          value=""
        />
      </LayerProvider>
    </ThemeProvider>
  )

  const textInput = container.querySelector('input') as HTMLInputElement

  return {onChange, onFocus, textInput}
}

// Note: for the tests to be deterministic we need this to ensure tests are run in a predefined timezone
// see globalSetup in jest config for details about how this is set up
test('timezone for the test environment should be set to America/Los_Angeles', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
})

test('does not emit onChange after invalid value has been typed', () => {
  const {textInput, onChange} = renderInput()

  userEvent.type(textInput, 'this is invalid')
  expect(textInput?.value).toBe('this is invalid')
  expect(onChange.mock.calls.length).toBe(0)

  fireEvent.blur(textInput)

  expect(onChange.mock.calls.length).toBe(0)
})

test('emits onChange on correct format if a valid value has been typed', () => {
  const {textInput, onChange} = renderInput()

  // note: the date is entered and displayed in local timezone (which is hardcoded to America/Los_Angeles)
  userEvent.type(textInput, '2021-03-28 10:23')
  expect(textInput?.value).toBe('2021-03-28 10:23')

  fireEvent.blur(textInput)

  // note: the date is entered and displayed in local timezone but stored in utc
  expect(onChange.mock.calls).toEqual([['2021-03-28T17:23:00.000Z']])
})
