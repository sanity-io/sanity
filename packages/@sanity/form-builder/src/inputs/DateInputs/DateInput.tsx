import type {Moment} from 'moment'
import moment from 'moment'

import React from 'react'
import {Marker} from '@sanity/types'
import PatchEvent, {set, unset} from '../../PatchEvent'
import {useDayzed} from 'dayzed'
import FocusLock from 'react-focus-lock'
import {differenceInCalendarMonths} from 'date-fns'
import {useId} from '@reach/auto-id'

import {Box, Button, Layer, Popover, TextInput, useClickOutside, useForwardedRef} from '@sanity/ui'
import {Calendar} from './Calendar'
import {FormField} from '../../components/FormField'

type ParsedOptions = {
  dateFormat: string
  calendarTodayLabel: string
}
type SchemaOptions = {
  dateFormat?: string
  calendarTodayLabel?: string
}
// This is the format dates are stored on
const VALUE_FORMAT = 'YYYY-MM-DD'
// default to how they are stored
const DEFAULT_DATE_FORMAT = VALUE_FORMAT
type Props = {
  value: string
  markers: Marker[]
  type: {
    name: string
    title: string
    description: string
    options?: SchemaOptions
    placeholder?: string
  }
  readOnly: boolean | null
  onChange: (event: PatchEvent) => void
  level: number
  onFocus: () => void
  presence: any
}

function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    calendarTodayLabel: options.calendarTodayLabel || 'Today',
  }
}

const DatePicker = React.forwardRef(function DatePicker(
  props: Omit<React.ComponentProps<'div'>, 'onSelect'> & {
    selected?: Date
    onSelect: (nextDate?: Date) => void
  },
  ref: React.ForwardedRef<HTMLElement>
) {
  const {selected, onSelect, ...rest} = props
  const [offset, setOffset] = React.useState(0)
  const [focusedDate, setFocusedDate] = React.useState(new Date())
  const dayzedData = useDayzed({
    showOutsideDays: true,
    selected: props.selected || new Date(),
    onDateSelected: (event) => onSelect(event.date),
    onOffsetChanged: setOffset,
    offset,
  })

  const handleFocusedDayChange = React.useCallback(
    (nextFocusedDate) => {
      const diff = differenceInCalendarMonths(nextFocusedDate, focusedDate)
      setFocusedDate(nextFocusedDate)
      if (diff !== 0) {
        setOffset(offset + diff)
      }
    },
    [focusedDate, offset]
  )

  React.useEffect(() => {
    handleFocusedDayChange(selected)
  }, [selected])

  return (
    <Calendar
      {...rest}
      ref={ref}
      {...dayzedData}
      offset={offset}
      onOffsetChange={setOffset}
      focusedDate={focusedDate}
      onFocusedDateChange={handleFocusedDayChange}
    />
  )
})

const DateInput = React.forwardRef(function DateInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, markers, type, readOnly, level, onFocus, presence, onChange} = props
  const {title, description} = type

  const {dateFormat} = parseOptions(type.options)
  const handleDatePickerChange = (nextDate?: Date) => {
    onChange(PatchEvent.from([nextDate ? set(nextDate.toISOString()) : unset()]))
  }

  const [datePickerRef, setDatePickerRef] = React.useState<HTMLElement>(null)

  const [inputValue, setInputValue] = React.useState(null)

  const handleInputBlur = (event) => {
    const parsed = moment(inputValue, dateFormat, true)
    if (parsed.isValid()) {
      setInputValue(null)
      onChange(PatchEvent.from([set(parsed.toISOString())]))
    } else {
      setInputValue(inputValue)
    }
  }

  const inputRef = useForwardedRef(forwardedRef)
  const buttonRef = React.useRef(null)

  const [isPickerOpen, setPickerOpen] = React.useState(false)
  const id = useId()

  useClickOutside(() => {
    setPickerOpen(false)
  }, [datePickerRef])

  const valueAsDate = value ? new Date(value) : new Date()

  return (
    <FormField
      markers={markers}
      label={title}
      level={level}
      description={description}
      presence={presence}
      labelFor={id}
    >
      <TextInput
        ref={inputRef}
        onFocus={onFocus}
        readOnly={readOnly}
        value={inputValue === null && value ? moment(value).format(dateFormat) : inputValue}
        onChange={(event) => {
          setInputValue(event.currentTarget.value)
        }}
        onBlur={handleInputBlur}
        suffix={
          <Layer>
            <Popover
              content={
                <FocusLock
                  onDeactivation={() => {
                    inputRef.current.focus()
                    inputRef.current.select()
                  }}
                >
                  <DatePicker
                    ref={setDatePickerRef}
                    onKeyUp={(e) => {
                      if (e.key === 'Escape') {
                        setPickerOpen(false)
                      }
                    }}
                    selected={valueAsDate}
                    onSelect={handleDatePickerChange}
                  />
                </FocusLock>
              }
              padding={4}
              placement="bottom"
              open={isPickerOpen}
            >
              <Box padding={2}>
                <Button
                  ref={buttonRef}
                  icon="calendar"
                  mode="bleed"
                  padding={1}
                  onClick={() => setPickerOpen(true)}
                />
              </Box>
            </Popover>
          </Layer>
        }
      />
    </FormField>
  )
})

export default DateInput
