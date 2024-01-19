import {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  ForwardedRef,
  HTMLProps,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useState,
} from 'react'
import {TextInput, TextInputProps} from '@sanity/ui'

/**
 * A TextInput that only emit onChange when it has to
 * By default it will only emit onChange when: 1) user hits enter or 2) user leaves the
 * field (e.g. onBlur) and the input value at this time is different from the given `value` prop
 */
export const LazyTextInput = forwardRef(function LazyTextInput(
  {onChange, onBlur, onKeyPress, value, ...rest}: TextInputProps & HTMLProps<HTMLInputElement>,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  const [inputValue, setInputValue] = useState<string>()

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value)
  }, [])

  const checkEvent = useCallback(
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

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      checkEvent(e)
      if (onBlur) {
        onBlur(e)
      }
    },
    [checkEvent, onBlur],
  )

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
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
