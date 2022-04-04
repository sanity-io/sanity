import {SanityDocument} from '@sanity/types'
import React from 'react'
import {PreviewFields} from '../../preview'
import {useSource} from '../../studio'

export interface DocTitleProps {
  document: Partial<Omit<SanityDocument, '_type'>> & {_type: SanityDocument['_type']}
}

function renderTitle({title}: Partial<SanityDocument>) {
  return <>{title || 'Untitled'}</>
}

export function DocTitle(props: DocTitleProps) {
  const {document} = props
  const {schema} = useSource()
  const schemaType = schema.get(document._type)

  if (!schemaType) {
    return <>&lt;Missing type&gt;</>
  }

  return (
    <PreviewFields document={document as any} type={schemaType}>
      {renderTitle}
    </PreviewFields>
  )
}
