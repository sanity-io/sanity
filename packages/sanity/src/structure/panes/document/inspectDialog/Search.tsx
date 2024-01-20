import {SearchIcon} from '@sanity/icons'
import {TextInput} from '@sanity/ui'
import type * as React from 'react'
import {useCallback} from 'react'
import {useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../i18n'

export function Search(props: {onChange: (q: string) => void; query: string}) {
  const {onChange, query} = props

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange],
  )
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <TextInput
      icon={SearchIcon}
      onChange={handleChange}
      placeholder={t('document-inspector.search.placeholder')}
      radius={2}
      value={query || ''}
    />
  )
}
