import React, {ReactElement} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {useFormState} from 'sanity/document'
import {unstable_useValuePreview as useValuePreview} from 'sanity'

export function DocumentHeaderTitle(): ReactElement {
  const {value: documentValue, schemaType, connectionState} = useFormState()
  const {title} = useDocumentPane()
  const subscribed = Boolean(documentValue) && connectionState === 'connected'

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: documentValue,
  })

  if (connectionState !== 'connected') {
    return <></>
  }

  if (title) {
    return <>{title}</>
  }

  if (!documentValue) {
    return <>New {schemaType?.title || schemaType?.name}</>
  }

  if (error) {
    return <>Error: {error.message}</>
  }

  return <>{value?.title || <span style={{color: 'var(--card-muted-fg-color)'}}>Untitled</span>}</>
}
