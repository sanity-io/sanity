import {SearchIcon} from '@sanity/icons/Search'
import {TextInput} from '@sanity/ui'
import {type ChangeEvent} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'

/**
 * Filter field shared by the document group inventory and picker.
 *
 * @internal
 */
export function DocumentGroupFilter({
  value,
  readOnly,
  onChange,
}: {
  value?: string
  readOnly?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const label = t('document-group-inventory.filter-string.label', {
    subject: t('document-group.subject.version_other'),
  })

  return (
    <search>
      <TextInput
        name={label}
        placeholder={label}
        icon={<SearchIcon />}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
      />
    </search>
  )
}
