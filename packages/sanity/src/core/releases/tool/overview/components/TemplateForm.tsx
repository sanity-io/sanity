import {type EditableReleaseDocument} from '@sanity/client'
import {Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {TitleDescriptionForm} from '../../../components/dialog/TitleDescriptionForm'
import {DocumentTypeSelector} from './DocumentTypeSelector'

export interface TemplateFormData extends EditableReleaseDocument {
  selectedDocumentTypes?: string[]
}

/** @internal */
export function TemplateForm(props: {
  onChange: (params: TemplateFormData) => void
  value: TemplateFormData
}): React.JSX.Element {
  const {onChange, value} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>(
    value.selectedDocumentTypes || [],
  )

  const handleTitleDescriptionChange = useCallback(
    (updatedValue: EditableReleaseDocument) => {
      onChange({
        ...updatedValue,
        selectedDocumentTypes,
      })
    },
    [onChange, selectedDocumentTypes],
  )

  const handleDocumentTypesChange = useCallback(
    (newSelectedTypes: string[]) => {
      setSelectedDocumentTypes(newSelectedTypes)
      onChange({
        ...value,
        selectedDocumentTypes: newSelectedTypes,
      })
    },
    [onChange, value],
  )

  return (
    <Stack space={5}>
      <Stack space={3}>
        <Text as="h3" size={2} weight="semibold">
          {t('template.form.title')}
        </Text>
        <Text muted size={1}>
          {t('template.form.description')}
        </Text>
      </Stack>

      <TitleDescriptionForm release={value} onChange={handleTitleDescriptionChange} />

      <DocumentTypeSelector
        selectedTypes={selectedDocumentTypes}
        onChange={handleDocumentTypesChange}
      />
    </Stack>
  )
}
