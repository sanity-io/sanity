import {PreviewValue, SanityDocument} from '@sanity/types'
import React from 'react'
import {useSchema} from '../../hooks'
import {PreviewFields} from '../../preview'

export interface DocTitleProps {
  document: Partial<Omit<SanityDocument, '_type'>> & {_type: SanityDocument['_type']}
}

function renderTitle({title}: Partial<SanityDocument> | PreviewValue) {
  return <>{title || 'Untitled'}</>
}

export function DocTitle(props: DocTitleProps) {
  const {document} = props
  const schema = useSchema()
  const schemaType = schema.get(document._type)

  if (!schemaType) {
    return <>&lt;Missing type&gt;</>
  }

  return (
    <PreviewFields value={document} schemaType={schemaType}>
      {renderTitle}
    </PreviewFields>
  )
}
