import {Autocomplete, Card, Flex, Text} from '@sanity/ui'
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

  // Show the author where each suggested dimension comes from (Amplitude / Segment /
  // Locale table / existing variants) so the picker reads as a map of the external
  // targeting space, not just a free-text field. FH-116 conceptual prototype.
  const renderOption = useCallback(
    (option: ConditionSuggestionOption) => (
      <Card as="button" padding={3} radius={2}>
        <Flex align="center" gap={3} justify="space-between">
          <Text size={1}>{option.value}</Text>
          <Text muted size={0}>
            {option.source}
          </Text>
        </Flex>
      </Card>
    ),
    [],
  )

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
      renderOption={renderOption}
      value={focused ? undefined : value}
    />
  )
}
