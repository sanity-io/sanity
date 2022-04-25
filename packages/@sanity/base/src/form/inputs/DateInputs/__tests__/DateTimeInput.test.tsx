import {fireEvent, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {LayerProvider, ThemeProvider, studioTheme} from '@sanity/ui'
import {DateTimeInput, DateTimeInputProps} from '../DateTimeInput'
import {FIXME} from '../../../types'

function renderInput(
  props: Omit<
    DateTimeInputProps,
    'focusPath' | 'onFocus' | 'onChange' | 'presence' | 'validation' | 'level' | 'type'
  >
) {
  const onFocus = jest.fn()
  const onChange = jest.fn()

  const {container} = render(
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <DateTimeInput
          focusPath={[]}
          type={{title: 'Test', name: 'datetime'} as FIXME}
          onFocus={onFocus}
          onChange={onChange}
          presence={[]}
          validation={[]}
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
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
})

test('does not emit onChange after invalid value has been typed', () => {
  const {textInput, onChange} = renderInput({} as any)

  userEvent.type(textInput, 'this is invalid')
  expect(textInput?.value).toBe('this is invalid')
  expect(onChange.mock.calls.length).toBe(0)

  fireEvent.blur(textInput)

  expect(onChange.mock.calls.length).toBe(0)
})

test('emits onChange on correct format if a valid value has been typed', () => {
  const {textInput, onChange} = renderInput({} as any)

  // note: the date is entered and displayed in local timezone (which is hardcoded to America/Los_Angeles)
  userEvent.type(textInput, '2021-03-28 10:23')
  expect(textInput?.value).toBe('2021-03-28 10:23')

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
              "value": "2021-03-28T17:23:00.000Z",
            },
          ],
        },
      ],
    ]
  `)
})

test('formatting of deserialized value', () => {
  const {textInput} = renderInput({value: '2021-03-28T17:23:00.000Z'} as any)
  expect(textInput?.value).toBe('2021-03-28 10:23')
})
