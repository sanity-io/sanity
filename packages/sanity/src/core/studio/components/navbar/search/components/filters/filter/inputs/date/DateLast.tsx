import {Box, Flex, Select, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useRef, useState} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import type {OperatorDateLastValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {StudioLocaleResourceKeys, useTranslation} from '../../../../../../../../../i18n'

type UnitChoice = {
  unit: OperatorDateLastValue['unit']
  key: StudioLocaleResourceKeys
}

const UNIT_CHOICES: UnitChoice[] = [
  {unit: 'day', key: 'search.filter-date-unit_days'},
  {unit: 'month', key: 'search.filter-date-unit_months'},
  {unit: 'year', key: 'search.filter-date-unit_years'},
]

export function SearchFilterDateLastInput({
  onChange,
  value,
}: OperatorInputComponentProps<OperatorDateLastValue>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(value?.unitValue || '')
  const dateUnit = useRef<OperatorDateLastValue['unit']>('day')
  const dateValue = useRef<OperatorDateLastValue['unitValue']>(value?.unitValue || null)
  const {t} = useTranslation()

  const {
    state: {fullscreen},
  } = useSearchState()

  const handleChange = useCallback(() => {
    onChange({
      unit: dateUnit?.current,
      unitValue: dateValue?.current,
    })
  }, [onChange])

  const handleUnitChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      dateUnit.current = event.currentTarget.value as OperatorDateLastValue['unit']
      handleChange()
    },
    [handleChange],
  )
  const handleValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setUncontrolledValue(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      dateValue.current = Number.isFinite(numValue) ? numValue : null
      handleChange()
    },
    [handleChange],
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          aria-label={t('search.filter-date-value-aria-label')}
          fontSize={fullscreen ? 2 : 1}
          onChange={handleValueChange}
          pattern="\d*"
          radius={2}
          step="1"
          type="number"
          value={uncontrolledValue}
        />
      </Box>
      <Box flex={1}>
        <Select
          aria-label={t('search.filter-date-unit-aria-label')}
          fontSize={fullscreen ? 2 : 1}
          onChange={handleUnitChange}
          radius={2}
          value={value?.unit}
        >
          {UNIT_CHOICES.map((choice) => (
            <option key={choice.key} value={choice.unit}>
              {t(choice.key)}
            </option>
          ))}
        </Select>
      </Box>
    </Flex>
  )
}
