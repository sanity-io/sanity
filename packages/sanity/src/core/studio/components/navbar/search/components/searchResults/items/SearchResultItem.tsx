import {ResponsivePaddingProps} from '@sanity/ui'
import React, {MouseEvent, useCallback} from 'react'
import {PreviewCard} from '../../../../../../../components/PreviewCard'
import {useSchema} from '../../../../../../../hooks'
import type {WeightedHit} from '../../../../../../../search'
import {useDocumentPresence, useDocumentPreviewStore} from '../../../../../../../store'
import {getPublishedId} from '../../../../../../../util/draftUtils'
import {CommandListItem} from '../../common/CommandListItem.styled'
import {DebugOverlay} from './DebugOverlay'
import SearchResultItemPreview from './SearchResultItemPreview'
import {useIntentLink} from 'sanity/router'

interface SearchItemProps extends ResponsivePaddingProps {
  data: WeightedHit
  debug?: boolean
  onClick?: () => void
  onMouseDown?: (event: MouseEvent) => void
  onMouseEnter?: () => void
  documentId: string
}

export function SearchResultItem({
  data,
  debug,
  documentId,
  onClick,
  onMouseDown,
  onMouseEnter,
}: SearchItemProps) {
  const {hit} = data
  const schema = useSchema()
  const type = schema.get(hit?._type)
  const documentPresence = useDocumentPresence(documentId)
  const documentPreviewStore = useDocumentPreviewStore()

  const {onClick: onIntentClick} = useIntentLink({
    intent: 'edit',
    params: {
      id: getPublishedId(hit._id),
      type: type?.name,
    },
  })

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      onIntentClick(e)
      onClick?.()
    },
    [onClick, onIntentClick]
  )

  if (!type) return null

  return (
    <PreviewCard
      as={CommandListItem}
      data-as="a"
      data-command-list-item
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      marginTop={1}
      marginX={1}
      padding={2}
      radius={2}
      tabIndex={-1}
    >
      <SearchResultItemPreview
        documentId={hit._id}
        documentPreviewStore={documentPreviewStore}
        presence={documentPresence}
        schemaType={type}
      />
      {debug && <DebugOverlay data={data} />}
    </PreviewCard>
  )
}
