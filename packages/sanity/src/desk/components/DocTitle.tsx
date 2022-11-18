import {SanityDocumentLike} from '@sanity/types'
import React from 'react'
import {useSchema, unstable_useValuePreview as useValuePreview} from 'sanity'

export interface DocTitleProps {
  document: SanityDocumentLike
}

export function DocTitle(props: DocTitleProps) {
  const {document: documentValue} = props
  const schema = useSchema()
  const schemaType = schema.get(documentValue._type)

  const {error, value} = useValuePreview({
    schemaType: schemaType!,
    value: documentValue,
  })

  if (!schemaType) {
    return <code>Unknown schema type: {documentValue._type}</code>
  }

  if (error) {
    return <>Error: {error.message}</>
  }

  return <>{value?.title || <span style={{color: 'var(--card-muted-fg-color)'}}>Untitled</span>}</>
}
