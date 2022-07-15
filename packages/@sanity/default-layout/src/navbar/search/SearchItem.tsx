// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {forwardRef, useMemo} from 'react'
import {Inline, Label, ResponsivePaddingProps} from '@sanity/ui'
import {IntentLink} from '@sanity/base/router'
import Preview from 'part:@sanity/base/preview?'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {DocumentPreviewPresence} from '@sanity/base/presence'
import {PreviewCard} from '@sanity/base/components'
import {useDocumentPresence} from '@sanity/base/hooks'
import {SearchHit} from '.'

interface SearchItemProps extends ResponsivePaddingProps {
  data: SearchHit
  onClick?: () => void
  documentId: string
}

export function SearchItem(props: SearchItemProps) {
  const {data, documentId, onClick, ...restProps} = props
  const {hit, resultIndex} = data
  const type = schema.get(hit?._type)
  const documentPresence = useDocumentPresence(documentId)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{id: getPublishedId(hit._id), type: type.name}}
            data-hit-index={resultIndex}
            ref={ref}
          />
        )
      }),
    [hit._id, resultIndex, type.name]
  )

  return (
    <PreviewCard
      __unstable_focusRing
      data-as="a"
      as={LinkComponent}
      onClick={onClick}
      {...restProps}
      radius={2}
    >
      <Preview
        value={hit}
        layout="default"
        type={type}
        status={
          <Inline space={3}>
            {documentPresence && documentPresence.length > 0 && (
              <DocumentPreviewPresence presence={documentPresence} />
            )}
            <Label size={0} muted style={{maxWidth: '175px'}} textOverflow="ellipsis">
              {type.title}
            </Label>
          </Inline>
        }
      />
    </PreviewCard>
  )
}
