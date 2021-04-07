// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {fireEvent, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {DateInput, Props} from '../DateInput'

function renderInput(props: Partial<Props> = {}) {
  const onFocus = jest.fn()
  const onChange = jest.fn()

  const {container} = render(
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <DateInput
          type={{title: 'Date input test', name: 'date', options: {}}}
          onFocus={onFocus}
          onChange={onChange}
          markers={[]}
          level={0}
          {...props}
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
  expect(new Date().getTimezoneOffset()).toBe(420)
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

  // note: the date is entered and displayed in local timezone
  userEvent.type(textInput, '2021-03-28')
  expect(textInput?.value).toBe('2021-03-28')

  fireEvent.blur(textInput)

  // note: the date is entered and displayed in local timezone but stored in utc
  expect(onChange.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        PatchEvent {
          "patches": Array [
            Object {
              "path": Array [],
              "type": "set",
              "value": "2021-03-28",
            },
          ],
        },
      ],
    ]
  `)
})

test('formatting of deserialized value', () => {
  const {textInput} = renderInput({value: '2021-03-28'})
  expect(textInput?.value).toBe('2021-03-28')
})
