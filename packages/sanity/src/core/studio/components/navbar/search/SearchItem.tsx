import {Inline, Label, ResponsivePaddingProps} from '@sanity/ui'
import React, {ReactNode, useMemo} from 'react'
import {useSchema} from '../../../../hooks'
import {useDocumentPresence} from '../../../../store'
import {SanityPreview} from '../../../../preview'
import {DocumentPreviewPresence} from '../../../../presence'
import {getPublishedId} from '../../../../util'
import {PreviewCard} from '../../../../components/PreviewCard'
import {FIXME} from '../../../../FIXME'
import {IntentLink} from 'sanity/router'

interface SearchItemProps extends ResponsivePaddingProps {
  onClick?: () => void
  documentId: string
  documentType: string
}

export function SearchItem(props: SearchItemProps) {
  const {documentId, documentType, onClick, ...restProps} = props
  const documentPresence = useDocumentPresence(documentId)
  const schema = useSchema()
  const schemaType = schema.get(documentType)
  const params = useMemo(
    () => ({id: getPublishedId(documentId), type: documentType}),
    [documentId, documentType]
  )
  const previewValue = useMemo(
    () => ({_id: documentId, _type: documentType}),
    [documentId, documentType]
  )

  const Link = useMemo(
    () =>
      function LinkComponent(linkProps: {children?: ReactNode}) {
        return <IntentLink {...linkProps} intent="edit" params={params} tabIndex={-1} />
      },
    [params]
  )

  if (!schemaType) return null

  return (
    <PreviewCard data-as="a" as={Link as FIXME} onClick={onClick} {...restProps} radius={2}>
      <SanityPreview
        layout="default"
        schemaType={schemaType}
        status={
          <Inline space={3}>
            {documentPresence && documentPresence.length > 0 && (
              <DocumentPreviewPresence presence={documentPresence} />
            )}

            <Label size={0} muted>
              {documentType || 'NONE'}
            </Label>
          </Inline>
        }
        value={previewValue}
      />
    </PreviewCard>
  )
}
