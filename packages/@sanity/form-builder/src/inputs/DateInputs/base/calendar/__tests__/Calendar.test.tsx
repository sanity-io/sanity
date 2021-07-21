// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render} from '@testing-library/react'
import React from 'react'

import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {Calendar, CalendarProps} from '../Calendar'

type Props = Partial<CalendarProps> & {
  selectedDate: Date
}
function renderInput(props: Props) {
  const onSelect = jest.fn()
  const onFocusedDateChange = jest.fn()

  const {container} = render(
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <Calendar
          {...props}
          ref={null}
          onSelect={onSelect}
          onFocusedDateChange={onFocusedDateChange}
        />
      </LayerProvider>
    </ThemeProvider>
  )

  const textInputs = container.querySelectorAll('input') as NodeListOf<HTMLInputElement>

  return {onSelect, textInputs}
}

describe('timeStep', () => {
  test('rounds down on 30 if timeStep is 60 ', () => {
    const {onSelect} = renderInput({
      selectedDate: new Date('2021-03-28T17:30:00.000Z'),
      selectTime: true,
      timeStep: 60,
    })
    expect(onSelect.mock.calls.length).toBe(1)
    expect(onSelect.mock.calls[0][0].toISOString()).toBe('2021-03-28T17:00:00.000Z')
  })

  test('rounds down on 59 if timeStep is 60 ', () => {
    const {onSelect} = renderInput({
      selectedDate: new Date('2021-03-28T17:59:00.000Z'),
      selectTime: true,
      timeStep: 60,
    })
    expect(onSelect.mock.calls.length).toBe(1)
    expect(onSelect.mock.calls[0][0].toISOString()).toBe('2021-03-28T17:00:00.000Z')
  })

  test('rounds down to 30 if timeStep is 30 ', () => {
    const {onSelect} = renderInput({
      selectedDate: new Date('2021-03-28T17:59:00.000Z'),
      selectTime: true,
      timeStep: 30,
    })
    expect(onSelect.mock.calls.length).toBe(1)
    expect(onSelect.mock.calls[0][0].toISOString()).toBe('2021-03-28T17:30:00.000Z')
  })
})
