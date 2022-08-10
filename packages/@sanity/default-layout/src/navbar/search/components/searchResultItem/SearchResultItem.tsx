// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {PreviewCard} from '@sanity/base/components'
import {useDocumentPresence} from '@sanity/base/hooks'
import {IntentLink} from '@sanity/base/router'
import type {ResponsivePaddingProps} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {forwardRef, useMemo} from 'react'
import type {SearchHit} from '../../types'
import {withCommandPaletteItemStyles} from '../../utils/withCommandPaletteItemStyles'
import SearchResultItemPreview from './SearchResultItemPreview'

interface SearchItemProps extends ResponsivePaddingProps {
  data: SearchHit
  onClick?: () => void
  documentId: string
}

const CommandPaletteIntentLink = withCommandPaletteItemStyles(IntentLink)

export function SearchResultItem(props: SearchItemProps) {
  const {data, documentId, onClick} = props
  const {hit, resultIndex} = data
  const type = schema.get(hit?._type)
  const documentPresence = useDocumentPresence(documentId)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <CommandPaletteIntentLink
            {...linkProps}
            data-hit-index={resultIndex}
            intent="edit"
            params={{id: getPublishedId(hit._id), type: type.name}}
            ref={ref}
          />
        )
      }),
    [hit._id, resultIndex, type.name]
  )

  return (
    <PreviewCard
      as={LinkComponent} //
      data-as="a"
      onClick={onClick}
      padding={2}
    >
      <SearchResultItemPreview documentId={hit._id} presence={documentPresence} schemaType={type} />
    </PreviewCard>
  )
}
