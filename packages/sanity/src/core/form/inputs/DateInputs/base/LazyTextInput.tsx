import React, {ChangeEvent, FocusEvent, HTMLProps, SyntheticEvent} from 'react'
import {TextInput, TextInputProps} from '@sanity/ui'

/**
 * A TextInput that only emit onChange when it has to
 * By default it will only emit onChange when: 1) user hits enter or 2) user leaves the
 * field (e.g. onBlur) and the input value at this time is different from the given `value` prop
 */
export const LazyTextInput = React.forwardRef(function LazyTextInput(
  {onChange, onBlur, onKeyPress, value, ...rest}: TextInputProps & HTMLProps<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const [inputValue, setInputValue] = React.useState<string>()

  const handleChange = React.useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value)
  }, [])

  const checkEvent = React.useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      const currentValue = event.currentTarget.value
      if (currentValue !== `${value}`) {
        if (onChange) {
          onChange(event)
        }
      }
      setInputValue(undefined)
    },
    [onChange, value],
  )

  const handleBlur = React.useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      checkEvent(e)
      if (onBlur) {
        onBlur(e)
      }
    },
    [checkEvent, onBlur],
  )

  const handleKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        checkEvent(e)
      }
      if (onKeyPress) {
        onKeyPress(e)
      }
    },
    [checkEvent, onKeyPress],
  )

  return (
    <TextInput
      {...rest}
      data-testid="date-input"
      ref={forwardedRef}
      value={inputValue === undefined ? value : inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyPress={handleKeyPress}
    />
  )
})
