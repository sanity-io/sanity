import {Autocomplete} from '@sanity/ui'
import {useCallback, useId, useState} from 'react'

import {type ConditionSuggestionOption, filterConditionOption} from './conditionSuggestions'

interface ConditionAutocompleteInputProps {
  ariaLabel: string
  autoFocus?: boolean
  customValidity?: string
  invalid?: boolean
  onChange: (value: string) => void
  options: ConditionSuggestionOption[]
  placeholder: string
  testId: string
  value: string
}

export function ConditionAutocompleteInput(
  props: ConditionAutocompleteInputProps,
): React.JSX.Element {
  const {
    ariaLabel,
    autoFocus,
    customValidity,
    invalid,
    onChange,
    options,
    placeholder,
    testId,
    value,
  } = props
  const id = useId()
  const [focused, setFocused] = useState(false)

  const handleQueryChange = useCallback(
    (nextValue: string | null) => {
      // `onChange` fires when an option is selected. Free-text typing is exposed
      // through `onQueryChange`; `null` means the internal query closed.
      if (nextValue !== null) {
        onChange(nextValue)
      }
    },
    [onChange],
  )

  return (
    <Autocomplete
      id={id}
      aria-invalid={invalid ? 'true' : undefined}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      customValidity={customValidity}
      data-testid={testId}
      filterOption={filterConditionOption}
      fontSize={1}
      onBlur={() => setFocused(false)}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onQueryChange={handleQueryChange}
      openButton
      options={options}
      placeholder={placeholder}
      value={focused ? undefined : value}
    />
  )
}
