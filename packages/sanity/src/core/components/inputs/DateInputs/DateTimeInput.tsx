import {CalendarIcon} from '@sanity/icons'
import {Box, Flex, LayerProvider, useClickOutsideEvent} from '@sanity/ui'
import {
  type FocusEvent,
  type ForwardedRef,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import FocusLock from 'react-focus-lock'

import {Button} from '../../../../ui-components/button/Button'
import {Popover} from '../../../../ui-components/popover/Popover'
import {type CalendarProps} from './calendar/Calendar'
import {type CalendarLabels} from './calendar/types'
import {DatePicker} from './DatePicker'
import {LazyTextInput} from './LazyTextInput'

export interface DateTimeInputProps {
  customValidity?: string
  id?: string
  inputValue?: string
  onChange: (date: Date | null) => void
  onInputChange?: (event: FocusEvent<HTMLInputElement>) => void
  placeholder?: string
  readOnly?: boolean
  selectTime?: boolean
  timeStep?: number
  value?: Date
  calendarLabels: CalendarLabels
  constrainSize?: boolean
  monthPickerVariant?: CalendarProps['monthPickerVariant']
  padding?: number
  disableInput?: boolean
}

export const DateTimeInput = forwardRef(function DateTimeInput(
  props: DateTimeInputProps,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  const {
    value,
    inputValue,
    onInputChange,
    onChange,
    selectTime,
    timeStep,
    calendarLabels,
    readOnly,
    constrainSize = true,
    monthPickerVariant,
    padding,
    disableInput,
    ...rest
  } = props
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const ref = useRef<HTMLInputElement | null>(null)
  const buttonRef = useRef(null)

  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
    forwardedRef,
    () => ref.current,
  )

  const [isPickerOpen, setPickerOpen] = useState(false)

  useClickOutsideEvent(
    () => setPickerOpen(false),
    () => [popoverRef.current],
  )

  const handleDeactivation = useCallback(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setPickerOpen(false)
    }
  }, [])

  const handleClick = useCallback(() => setPickerOpen(true), [])

  const suffix = readOnly ? null : (
    <Flex style={{padding: '5px'}}>
      <Button
        disabled={readOnly}
        aria-label={calendarLabels.ariaLabel}
        ref={buttonRef}
        icon={CalendarIcon}
        mode="bleed"
        onClick={handleClick}
        style={{display: 'block'}}
        data-testid="select-date-button"
        tooltipProps={{content: calendarLabels.tooltipText}}
      />
    </Flex>
  )

  return (
    <LazyTextInput
      ref={ref}
      {...rest}
      readOnly={disableInput || readOnly}
      value={inputValue}
      onChange={onInputChange}
      suffix={
        isPickerOpen ? (
          // Note: we're conditionally inserting the popover here due to an
          // issue with popovers rendering incorrectly on subsequent renders
          // see https://github.com/sanity-io/design/issues/519
          <LayerProvider zOffset={1000}>
            <Popover
              constrainSize={constrainSize}
              data-testid="date-input-dialog"
              referenceElement={ref.current}
              portal
              content={
                <Box overflow="auto">
                  <FocusLock onDeactivation={handleDeactivation}>
                    <DatePicker
                      monthPickerVariant={monthPickerVariant}
                      calendarLabels={calendarLabels}
                      selectTime={selectTime}
                      timeStep={timeStep}
                      onKeyUp={handleKeyUp}
                      value={value}
                      onChange={onChange}
                      padding={padding}
                    />
                  </FocusLock>
                </Box>
              }
              open
              placement="bottom"
              ref={popoverRef}
            >
              <>{suffix}</>
            </Popover>
          </LayerProvider>
        ) : (
          suffix
        )
      }
    />
  )
})
