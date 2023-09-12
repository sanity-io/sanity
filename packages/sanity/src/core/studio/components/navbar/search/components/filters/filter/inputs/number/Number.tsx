import {TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useState} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {useTranslation} from '../../../../../../../../../i18n'

export function SearchFilterNumberInput({value, onChange}: OperatorInputComponentProps<number>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(value ?? '')

  const {
    state: {fullscreen},
  } = useSearchState()
  const {t} = useTranslation()

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setUncontrolledValue(event.currentTarget.value)
      const numValue = parseFloat(event.currentTarget.value)
      onChange(Number.isFinite(numValue) ? numValue : null)
    },
    [onChange],
  )

  return (
    <TextInput
      fontSize={fullscreen ? 2 : 1}
      onChange={handleChange}
      placeholder={t('search.filter.number-value-placeholder')}
      radius={2}
      step="any"
      type="number"
      value={uncontrolledValue}
    />
  )
}
