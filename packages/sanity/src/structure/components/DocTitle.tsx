import {type SanityDocumentLike} from '@sanity/types'
import {vars} from '@sanity/ui/css'
import {useSchema, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../i18n'
import {useDocumentTitle} from '../panes'

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
    <>{title || <span style={{color: vars.color.muted.fg}}>{t('doc-title.fallback.text')}</span>}</>
  )
}
