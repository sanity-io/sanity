import {defineField, type StringSchemaType} from '@sanity/types'
import {fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, test, vi} from 'vitest'

import {renderStringInput} from '../../../../../../test/form'
import {timeZoneLocalStorageNamespace} from '../../../../hooks/useTimeZone'
import {FormValueProvider} from '../../../contexts/FormValue'
import {type StringInputProps} from '../../../types'
import {DateTimeInput} from '../DateTimeInput'

vi.mock('sanity', () => ({
  set: vi.fn(),
}))

const DateTimeInputWithFormValue = (inputProps: StringInputProps<StringSchemaType>) => (
  <FormValueProvider value={{_id: 'test123', _type: 'datetime'}}>
    <DateTimeInput {...inputProps} />
  </FormValueProvider>
)

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
    render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
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
    render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
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
    render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
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
    render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
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
    render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  expect(input.value).toBe('2021-06-15 14:00')
})

test('Make sure time is displaying in wall time when displayTimeZone is not set', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
    }),
    props: {documentValue: {test: '2021-06-15T12:00:00.000Z'}},
    render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
  })

  const input = result.container.querySelector('input')!

  expect(input.value).toBe('2021-06-15 05:00')
})

test('Make sure we are respecting the saved timezone in localStorage when displayTimeZone is set', async () => {
  const documentId = 'testDoc123'
  const fieldName = 'test'
  const localStorageKey = `${timeZoneLocalStorageNamespace}input.${documentId}.${fieldName}`
  const initialUtcValue = '2021-06-15T12:00:00.000Z'

  localStorage.setItem(localStorageKey, 'Asia/Tokyo')

  try {
    const {result} = await renderStringInput({
      fieldDefinition: defineField({
        type: 'datetime',
        name: fieldName,
        options: {
          displayTimeZone: 'Europe/Oslo',
          allowTimeZoneSwitch: true,
        },
      }),
      props: {
        documentValue: {_id: documentId, _type: 'datetime', [fieldName]: initialUtcValue},
        id: fieldName,
        value: initialUtcValue,
        onChange: vi.fn(),
      },
      render: (inputProps) => (
        <FormValueProvider value={{_id: documentId, _type: 'datetime'}}>
          <DateTimeInput {...inputProps} />
        </FormValueProvider>
      ),
    })

    const input = result.container.querySelector('input')!

    expect(input.value).toBe('2021-06-15 21:00')

    const timeZoneButton = result.getAllByTestId('timezone-button')[0]
    expect(timeZoneButton).toHaveTextContent('Tokyo')
  } finally {
    localStorage.removeItem(localStorageKey)
  }
})

test('Make sure that if the localStorage timezone is set but the allowTimeZoneSwitch is false, that we respect the displayTimeZone', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
      options: {displayTimeZone: 'Europe/Oslo', allowTimeZoneSwitch: false},
    }),
    props: {documentValue: {test: '2021-06-15T12:00:00.000Z'}},
    render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
  })

  const input = result.container.querySelector('input')!
  // should be 2 hours ahead for Oslo in Summer
  expect(input.value).toBe('2021-06-15 14:00')
})

test('the time zone can not be changed by the user if not allowed', async () => {
  const {result} = await renderStringInput({
    fieldDefinition: defineField({
      type: 'datetime',
      name: 'test',
      options: {displayTimeZone: 'Europe/Oslo', allowTimeZoneSwitch: false},
    }),
    props: {documentValue: {test: '2021-06-15T12:00:00.000Z'}},
    render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
  })

  // click on the TimeZoneButton
  const timeZoneButton = result.getByText('Oslo')
  userEvent.click(timeZoneButton)
  // ensure the dialog shows
  expect(result.queryByText('Select time zone')).not.toBeInTheDocument()
})
// utc timestamp
const TEST_DATE_ISO = '2021-03-28T17:23:00.000Z'

const expected = {
  YYYY: '2021',
  YY: '21',
  Y: '2021',
  YYYYY: '02021',
  Q: '1',
  Qo: '1st',
  MMMM: 'March',
  MMM: 'Mar',
  MM: '03',
  M: '3',
  Mo: '3rd',
  DD: '28',
  D: '28',
  Do: '28th',
  dddd: 'Sunday',
  ddd: 'Sun',
  dd: 'Su',
  d: '0',
  E: '7',
  w: '13',
  wo: '13th',
  ww: '13',
  WW: '13',
  W: '13',
  Wo: '13th',
  gggg: '2021',
  gg: '21',
  GGGG: '2021',
  GG: '21',
  DDD: '87', // 87th day of year
  DDDD: '087',
  DDDo: '87th',
  HH: '10',
  H: '10',
  hh: '10',
  h: '10',
  k: '10',
  kk: '10',
  mm: '23',
  m: '23',
  ss: '00',
  s: '0',
  A: 'AM',
  a: 'am',
  X: '1616952180',
  x: '1616952180000',
  N: 'AD',
  NN: 'AD',
  NNN: 'AD',
  NNNN: 'Anno Domini',
  NNNNN: 'AD',
  Z: '-07:00',
  ZZ: '-0700',
  z: 'PDT',
  zz: 'PDT',
  S: '0',
  SS: '00',
  SSS: '000',
  SSSS: '0000',
}

Object.entries(expected).forEach(([format, expectedValue]) => {
  test(`renders date in format token "${format}"`, async () => {
    const {result} = await renderStringInput({
      fieldDefinition: defineField({
        type: 'datetime',
        name: 'test',
        options: {dateFormat: format},
      }),
      props: {documentValue: {test: TEST_DATE_ISO}},
      render: (inputProps) => <DateTimeInputWithFormValue {...inputProps} />,
    })
    const input = result.container.querySelector('input')!
    if (expectedValue instanceof RegExp) {
      expect(input.value).toMatch(expectedValue)
    } else {
      expect(input.value).toContain(expectedValue)
    }
  })
})
