import {type SanityDocumentLike} from '@sanity/types'
import {unstable_useValuePreview as useValuePreview, useSchema, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../i18n'

export interface DocTitleProps {
  document: SanityDocumentLike
}

export function DocTitle(props: DocTitleProps) {
  const {document: documentValue} = props
  const schema = useSchema()
  const schemaType = schema.get(documentValue._type)
  const {t} = useTranslation(structureLocaleNamespace)

  const {error, value} = useValuePreview({
    schemaType: schemaType!,
    value: documentValue,
  })

  if (!schemaType) {
    return <code>{t('doc-title.unknown-schema-type.text', {schemaType: documentValue._type})}</code>
  }

  if (error) {
    return <>{t('doc-title.error.text', {errorMessage: error.message})}</>
  }

  return (
    <>
      {value?.title || (
        <span style={{color: 'var(--card-muted-fg-color)'}}>{t('doc-title.fallback.text')}</span>
      )}
    </>
  )
}
