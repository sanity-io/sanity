import {SearchIcon} from '@sanity/icons'
import {TextInput} from '@sanity/ui'
import React, {useCallback} from 'react'
import {deskLocaleNamespace} from '../../../i18n'
import {useTranslation} from 'sanity'

export function Search(props: {onChange: (q: string) => void; query: string}) {
  const {onChange, query} = props

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange],
  )
  const {t} = useTranslation(deskLocaleNamespace)

  return (
    <TextInput
      icon={SearchIcon}
      onChange={handleChange}
      placeholder={t('inputs.inspect-dialog.search.placeholder')}
      radius={2}
      value={query || ''}
    />
  )
}
