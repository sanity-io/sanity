import React, {forwardRef, useMemo} from 'react'
import {Inline, Label, ResponsivePaddingProps} from '@sanity/ui'
import {PreviewCard} from '../../../../components/PreviewCard'
import {useDocumentPresence, useSchema} from '../../../../hooks'
import {DocumentPreviewPresence} from '../../../../presence'
import {IntentLink} from '../../../../router'
import {SanityPreview} from '../../../../preview'
import {getPublishedId} from '../../../../util'
import {WeightedHit} from '../../../../search/weighted/types'

interface SearchItemProps extends ResponsivePaddingProps {
  data: WeightedHit
  onClick?: () => void
  documentId: string
}

export function SearchItem(props: SearchItemProps) {
  const {data, documentId, onClick, ...restProps} = props
  const {hit, resultIndex} = data
  const publishedId = getPublishedId(documentId)
  const documentPresence = useDocumentPresence(publishedId)
  const schema = useSchema()
  const schemaType = schema.get(hit._type)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{id: publishedId, type: hit._type}}
            data-hit-index={resultIndex}
            tabIndex={-1}
            ref={ref}
          />
        )
      }),
    [publishedId, hit._type, resultIndex]
  )

  if (!schemaType) return null

  return (
    <PreviewCard data-as="a" as={LinkComponent} onClick={onClick} {...restProps} radius={2}>
      <SanityPreview
        layout="default"
        schemaType={schemaType}
        status={
          <Inline space={3}>
            {documentPresence && documentPresence.length > 0 && (
              <DocumentPreviewPresence presence={documentPresence} />
            )}

            <Label size={0} muted>
              {hit._type}
            </Label>
          </Inline>
        }
        value={{_id: publishedId}}
      />
    </PreviewCard>
  )
}
