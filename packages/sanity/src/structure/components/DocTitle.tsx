import {type SanityDocumentLike} from '@sanity/types'
import {useSchema, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../i18n'
import {useDocumentTitle} from '../panes/document/useDocumentTitle'

export interface DocTitleProps {
  document: SanityDocumentLike
}

export function DocTitle(props: DocTitleProps) {
  const {document: documentValue} = props
  const schema = useSchema()
  const schemaType = schema.get(documentValue._type)
  const {t} = useTranslation(structureLocaleNamespace)
  const {title} = useDocumentTitle()

  if (!schemaType) {
    return <code>{t('doc-title.unknown-schema-type.text', {schemaType: documentValue._type})}</code>
  }

  return (
    <>
      {title || (
        <span style={{color: 'var(--card-muted-fg-color)'}}>{t('doc-title.fallback.text')}</span>
      )}
    </>
  )
}
