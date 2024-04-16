import {TextInput} from '@sanity/ui'
import {
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type ForwardedRef,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useState,
} from 'react'

type TextInputProps = ComponentProps<typeof TextInput>

type Workaround = any

type Props = Workaround &
  Omit<TextInputProps, 'onChange'> & {
    onChange?: (event: FocusEvent<HTMLInputElement> | ChangeEvent<HTMLInputElement>) => void
  }

/**
 * A TextInput that only emit onChange when it has to
 * By default it will only emit onChange when: 1) user hits enter or 2) user leaves the
 * field (e.g. onBlur) and the input value at this time is different from the given `value` prop
 */
export const LazyTextInput = forwardRef(function LazyTextInput(
  {onChange, onBlur, onKeyPress, value, ...rest}: Props,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  const [inputValue, setInputValue] = useState<string>()

  const handleChange = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value)
  }, [])

  const checkEvent = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
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
    (e: KeyboardEvent<HTMLInputElement>) => {
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
