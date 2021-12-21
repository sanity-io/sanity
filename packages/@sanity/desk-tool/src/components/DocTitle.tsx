import {SanityDocument} from '@sanity/types'
import React from 'react'
import {PreviewFields} from '@sanity/base/preview'
import {useSource} from '@sanity/base'

export interface DocTitleProps {
  document: Partial<Omit<SanityDocument, '_type'>> & {_type: SanityDocument['_type']}
}

const renderTitle = ({title}: any) => <>{title || 'Untitled'}</>

const PREVIEW_FIELDS = ['title']

export function DocTitle(props: DocTitleProps) {
  const {document} = props
  const {schema} = useSource()
  const schemaType = schema.get(document._type)

  if (!schemaType) {
    return <>&lt;Missing type&gt;</>
  }

  return (
    <PreviewFields
      document={document as any}
      fields={PREVIEW_FIELDS}
      layout="inline"
      type={schemaType}
    >
      {renderTitle}
    </PreviewFields>
  )
}
