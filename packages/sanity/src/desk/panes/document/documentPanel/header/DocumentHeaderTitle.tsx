import i18n from 'i18next'
import k from './../../../../../i18n/keys'
import React, {ReactElement} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {unstable_useValuePreview as useValuePreview} from 'sanity'

export function DocumentHeaderTitle(): ReactElement {
  const {connectionState, schemaType, title, value: documentValue} = useDocumentPane()
  const subscribed = Boolean(documentValue) && connectionState === 'connected'

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: documentValue,
  })

  if (connectionState !== 'connected') {
    return <></>
  }

  if (!documentValue) {
    return (
      <>
        {i18n.t(k.NEW)} {schemaType?.title || schemaType?.name}
      </>
    )
  }

  if (subscribed) {
    if (error) {
      return (
        <>
          {i18n.t(k.ERROR2)} {error.message}
        </>
      )
    }

    return (
      <>
        {value?.title || (
          <span style={{color: 'var(--card-muted-fg-color)'}}>{i18n.t(k.UNTITLED)}</span>
        )}
      </>
    )
  }

  return <>{title}</>
}
