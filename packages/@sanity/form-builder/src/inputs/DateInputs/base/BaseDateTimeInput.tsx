import React from 'react'
import FocusLock from 'react-focus-lock'

import {Box, Button, Layer, Popover, TextInput, useClickOutside, useForwardedRef} from '@sanity/ui'
import {DatePicker} from './DatePicker'

type Props = {
  value: Date | null
  format: (date: Date) => string
  parse: (dateString: string) => Date | null
  id?: string
  readOnly: boolean | null
  placeholder?: string
  onChange: (date: Date | null) => void
}

const DateInput = React.forwardRef(function DateInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, readOnly, onChange, id, format, parse} = props

  const [popoverRef, setPopoverRef] = React.useState<HTMLElement | null>(null)

  const [inputValue, setInputValue] = React.useState<string | null>(null)

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (inputValue === null) {
      return
    }
    const parsed = parse(inputValue)
    if (parsed) {
      setInputValue(null)
      onChange(parsed)
    } else {
      // todo: show validation error
      setInputValue(inputValue)
    }
  }

  const inputRef = useForwardedRef(forwardedRef)
  const buttonRef = React.useRef(null)

  const [isPickerOpen, setPickerOpen] = React.useState(false)

  useClickOutside(() => setPickerOpen(false), [popoverRef])

  const placeholder = props.placeholder || `e.g. ${format(new Date())}`

  return (
    <TextInput
      ref={inputRef}
      id={id || ''}
      readOnly={Boolean(readOnly)}
      placeholder={placeholder}
      value={value ? format(value) : ''}
      onChange={(event) => {
        setInputValue(event.currentTarget.value)
      }}
      onBlur={handleInputBlur}
      suffix={
        <Layer>
          <Popover
            ref={setPopoverRef}
            content={
              <FocusLock
                onDeactivation={() => {
                  inputRef.current?.focus()
                  inputRef.current?.select()
                }}
              >
                <DatePicker
                  onKeyUp={(e) => {
                    if (e.key === 'Escape') {
                      setPickerOpen(false)
                    }
                  }}
                  selectTime
                  value={value}
                  onChange={onChange}
                />
              </FocusLock>
            }
            padding={4}
            placement="bottom"
            open={isPickerOpen}
          >
            <Box padding={2} paddingX={4}>
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
  )
})

export default DateInput
