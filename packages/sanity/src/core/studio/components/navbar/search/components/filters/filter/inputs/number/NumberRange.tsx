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
  const [to, setTo] = useState(value?.to ?? '')
  const [from, setFrom] = useState(value?.from ?? '')

  const {
    state: {fullscreen},
  } = useSearchState()
  const {t} = useTranslation()

  const handleToChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setTo(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      onChange({
        to: Number.isFinite(numValue) ? numValue : null,
        from: value?.from ?? null,
      })
    },
    [value?.from, onChange],
  )
  const handleFromChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFrom(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      onChange({
        to: value?.to ?? null,
        from: Number.isFinite(numValue) ? numValue : null,
      })
    },
    [value?.to, onChange],
  )

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={fullscreen ? 2 : 1}
          onChange={handleFromChange}
          placeholder={t('search.filter-number-min-value-placeholder')}
          radius={2}
          step="any"
          type="number"
          value={from}
        />
      </Box>
      <Box flex={1}>
        <TextInput
          fontSize={fullscreen ? 2 : 1}
          onChange={handleToChange}
          placeholder={t('search.filter-number-max-value-placeholder')}
          radius={2}
          step="any"
          type="number"
          value={to}
        />
      </Box>
    </Flex>
  )
}
