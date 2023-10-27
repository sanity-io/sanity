import React, {ReactElement} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {deskLocaleNamespace} from '../../../../i18n'
import {unstable_useValuePreview as useValuePreview, useTranslation} from 'sanity'

export function DocumentHeaderTitle(): ReactElement {
  const {connectionState, schemaType, title, value: documentValue} = useDocumentPane()
  const subscribed = Boolean(documentValue) && connectionState === 'connected'

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: documentValue,
  })
  const {t} = useTranslation(deskLocaleNamespace)

  if (connectionState !== 'connected') {
    return <></>
  }

  if (title) {
    return <>{title}</>
  }

  if (!documentValue) {
    return (
      <>
        {t('header.document-header-title.new.text', {item: schemaType?.title || schemaType?.name})}
      </>
    )
  }

  if (error) {
    return <>{t('header.document-header-title.error.text', {error: error.message})}</>
  }

  return (
    <>
      {value?.title || (
        <span style={{color: 'var(--card-muted-fg-color)'}}>
          {t('header.document-header-title.untitled.text')}
        </span>
      )}
    </>
  )
}
