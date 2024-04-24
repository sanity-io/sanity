import {CalendarIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  LayerProvider,
  useClickOutside,
  useForwardedRef,
  usePortal,
} from '@sanity/ui'
import {
  type FocusEvent,
  type ForwardedRef,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react'
import FocusLock from 'react-focus-lock'

import {Popover} from '../../../../../ui-components'
import {LazyTextInput} from '../../../../form/inputs/DateInputs/base/LazyTextInput'
import {DatePicker} from './DatePicker'

type Props = {
  value?: Date
  id?: string
  readOnly?: boolean
  selectTime?: boolean
  timeStep?: number
  customValidity?: string
  placeholder?: string
  onInputChange?: (event: FocusEvent<HTMLInputElement>) => void
  inputValue?: string
  onChange: (date: Date | null) => void
  customValidation?: (selectedDate: Date) => boolean
}

export const DateTimeInput = forwardRef(function DateTimeInput(
  props: Props,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  const {
    value,
    inputValue,
    customValidation,
    onInputChange,
    onChange,
    selectTime,
    timeStep,
    ...rest
  } = props

  const [popoverRef, setPopoverRef] = useState<HTMLElement | null>(null)

  const inputRef = useForwardedRef(forwardedRef)
  const buttonRef = useRef(null)

  const [isPickerOpen, setPickerOpen] = useState(false)

  const portal = usePortal()

  useClickOutside(() => setPickerOpen(false), [popoverRef])

  const handleDeactivation = useCallback(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [inputRef])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setPickerOpen(false)
    }
  }, [])

  const handleClick = useCallback(() => setPickerOpen(true), [])

  const suffix = (
    <Box style={{padding: '5px'}}>
      <Button
        ref={buttonRef}
        icon={CalendarIcon}
        mode="bleed"
        padding={2}
        onClick={handleClick}
        style={{display: 'block'}}
        data-testid="select-date-button"
      />
    </Box>
  )

  return (
    <LazyTextInput
      ref={inputRef}
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
              content={
                <Box overflow="auto">
                  <FocusLock onDeactivation={handleDeactivation}>
                    <DatePicker
                      selectTime={selectTime}
                      timeStep={timeStep}
                      onKeyUp={handleKeyUp}
                      value={value}
                      onChange={onChange}
                      customValidation={customValidation}
                    />
                  </FocusLock>
                </Box>
              }
              data-testid="date-input-dialog"
              fallbackPlacements={['bottom', 'bottom-start', 'top-end', 'top', 'top-start']}
              floatingBoundary={portal.element}
              open
              placement="bottom-end"
              portal
              radius={2}
              ref={setPopoverRef}
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
