import React, {forwardRef, useCallback, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {Box, LayerProvider, Popover, useClickOutside, useForwardedRef} from '@sanity/ui'
import {CalendarIcon} from '@sanity/icons'
import {Button} from '../../../../../ui'
import {DatePicker} from './DatePicker'
import {LazyTextInput} from './LazyTextInput'

export interface DateTimeInputProps {
  customValidity?: string
  id?: string
  inputValue?: string
  onChange: (date: Date | null) => void
  onInputChange?: (event: React.FocusEvent<HTMLInputElement>) => void
  placeholder?: string
  readOnly?: boolean
  selectTime?: boolean
  timeStep?: number
  value?: Date
}

export const DateTimeInput = forwardRef(function DateTimeInput(
  props: DateTimeInputProps,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const {value, inputValue, onInputChange, onChange, selectTime, timeStep, ...rest} = props
  const [popoverRef, setPopoverRef] = useState<HTMLElement | null>(null)
  const forwardedRef = useForwardedRef(ref)
  const buttonRef = useRef(null)

  const [isPickerOpen, setPickerOpen] = useState(false)

  useClickOutside(() => setPickerOpen(false), [popoverRef])

  const handleDeactivation = useCallback(() => {
    forwardedRef.current?.focus()
    forwardedRef.current?.select()
  }, [forwardedRef])

  const handleKeyUp = useCallback((e: any) => {
    if (e.key === 'Escape') {
      setPickerOpen(false)
    }
  }, [])

  const handleClick = useCallback(() => setPickerOpen(true), [])

  const suffix = (
    <Box padding={1}>
      <Button
        ref={buttonRef}
        icon={CalendarIcon}
        mode="bleed"
        size="small"
        onClick={handleClick}
        style={{display: 'block'}}
        data-testid="select-date-button"
        tooltipProps={{content: 'Select date', disabled: isPickerOpen}}
      />
    </Box>
  )

  return (
    <LazyTextInput
      ref={forwardedRef}
      {...rest}
      value={inputValue}
      onChange={onInputChange}
      suffix={
        isPickerOpen ? (
          // Note: we're conditionally inserting the popover here due to an
          // issue with popovers rendering incorrectly on subsequent renders
          // see https://github.com/sanity-io/design/issues/519
          <LayerProvider zOffset={1000}>
            <Popover
              constrainSize
              data-testid="date-input-dialog"
              portal
              content={
                <Box overflow="auto">
                  <FocusLock onDeactivation={handleDeactivation}>
                    <DatePicker
                      selectTime={selectTime}
                      timeStep={timeStep}
                      onKeyUp={handleKeyUp}
                      value={value}
                      onChange={onChange}
                    />
                  </FocusLock>
                </Box>
              }
              open
              placement="bottom"
              ref={setPopoverRef}
              radius={2}
            >
              {suffix}
            </Popover>
          </LayerProvider>
        ) : (
          suffix
        )
      }
    />
  )
})
