import {Box, Flex, TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useState} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import {OperatorNumberRangeValue} from '../../../../../definitions/operators/common'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {useTranslation} from '../../../../../../../../../i18n'

export function SearchFilterNumberRangeInput({
  onChange,
  value,
}: OperatorInputComponentProps<OperatorNumberRangeValue>) {
  const [max, setMax] = useState(value?.max ?? '')
  const [min, setMin] = useState(value?.min ?? '')

  const {
    state: {fullscreen},
  } = useSearchState()
  const {t} = useTranslation()

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMax(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      onChange({
        max: Number.isFinite(numValue) ? numValue : null,
        min: value?.min ?? null,
      })
    },
    [value?.min, onChange],
  )
  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMin(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      onChange({
        max: value?.max ?? null,
        min: Number.isFinite(numValue) ? numValue : null,
      })
    },
    [value?.max, onChange],
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={fullscreen ? 2 : 1}
          onChange={handleMinChange}
          placeholder={t('search.filter.number-min-value-placeholder')}
          radius={2}
          step="any"
          type="number"
          value={min}
        />
      </Box>
      <Box flex={1}>
        <TextInput
          fontSize={fullscreen ? 2 : 1}
          onChange={handleMaxChange}
          placeholder={t('search.filter.number-max-value-placeholder')}
          radius={2}
          step="any"
          type="number"
          value={max}
        />
      </Box>
    </Flex>
  )
}
