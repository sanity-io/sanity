import {SearchIcon} from '@sanity/icons/Search'
import {TextInput} from '@sanity/ui'
import {type ChangeEvent, useCallback, useState} from 'react'
import {useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../i18n'

interface SearchProps {
  onChange: (q: string) => void
  query: string
}

export function Search(props: SearchProps) {
  const {onChange, query} = props
  const [value, setValue] = useState(query || '')

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextQuery = event.currentTarget.value
      setValue(nextQuery)
      onChange(nextQuery)
    },
    [onChange],
  )
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <TextInput
      icon={SearchIcon}
      onChange={handleChange}
      placeholder={t('document-inspector.search.placeholder')}
      radius={2}
      value={value}
    />
  )
}
