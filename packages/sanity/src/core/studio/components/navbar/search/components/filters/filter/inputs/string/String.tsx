import {TextInput} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {useTranslation} from '../../../../../../../../../i18n'

export function SearchFilterStringInput({
  onChange,
  value,
}: OperatorInputComponentProps<number | string>) {
  const {
    state: {fullscreen},
  } = useSearchState()
  const {t} = useTranslation()

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value || null),
    [onChange],
  )

  return (
    <TextInput
      fontSize={fullscreen ? 2 : 1}
      onChange={handleChange}
      placeholder={t('search.filter-string-value-placeholder')}
      radius={2}
      value={value || ''}
    />
  )
}
