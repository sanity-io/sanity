import {type ReactElement} from 'react'
import {unstable_useValuePreview as useValuePreview, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'

export function DocumentHeaderTitle(): ReactElement {
  const {connectionState, schemaType, title, editState} = useDocumentPane()
  const documentValue = editState?.draft || editState?.published
  const subscribed = Boolean(documentValue)

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: documentValue,
  })
  const {t} = useTranslation(structureLocaleNamespace)

  if (connectionState === 'connecting' && !subscribed) {
    return <></>
  }

  if (title) {
    return <>{title}</>
  }

  if (!documentValue) {
    return (
      <>
        {t('panes.document-header-title.new.text', {
          schemaType: schemaType?.title || schemaType?.name,
        })}
      </>
    )
  }

  if (error) {
    return <>{t('panes.document-header-title.error.text', {error: error.message})}</>
  }

  return (
    <>
      {value?.title || (
        <span style={{color: 'var(--card-muted-fg-color)'}}>
          {t('panes.document-header-title.untitled.text')}
        </span>
      )}
    </>
  )
}
