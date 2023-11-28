import {Select} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import {type OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {useTranslation} from '../../../../../../../../../i18n'

export function SearchFilterBooleanInput({onChange, value}: OperatorInputComponentProps<boolean>) {
  const {
    state: {fullscreen},
  } = useSearchState()
  const {t} = useTranslation()

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange(event.currentTarget.value === 'true')
    },
    [onChange],
  )

  return (
    <Select
      fontSize={fullscreen ? 2 : 1}
      onChange={handleChange}
      radius={2}
      value={String(value ?? true)}
    >
      <option value="true">{t('search.filter-boolean-true')}</option>
      <option value="false">{t('search.filter-boolean-false')}</option>
    </Select>
  )
}
