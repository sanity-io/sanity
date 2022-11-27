import {ResponsiveMarginProps, ResponsivePaddingProps} from '@sanity/ui'
import React, {MouseEvent, useCallback} from 'react'
import {PreviewCard} from '../../../../../../../components/PreviewCard'
import {useSchema} from '../../../../../../../hooks'
import {useDocumentPresence} from '../../../../../../../store'
import {useCommandList} from '../../../contexts/commandList'
import {CommandListItem} from '../../common/CommandListItem.styled'
import SearchResultItemPreview from './SearchResultItemPreview'
import {useIntentLink} from 'sanity/router'

interface SearchItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  disableIntentLink?: boolean
  documentId: string
  documentType: string
  index: number | null
  onClick?: () => void
}

export function SearchResultItem({
  disableIntentLink,
  documentId,
  index,
  documentType,
  onClick,
  ...rest
}: SearchItemProps) {
  const schema = useSchema()
  const type = schema.get(documentType)
  const documentPresence = useDocumentPresence(documentId)

  const {onChildMouseDown, onChildMouseEnter} = useCommandList()

  const {onClick: onIntentClick} = useIntentLink({
    intent: 'edit',
    params: {
      id: documentId,
      type: type?.name,
    },
  })

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!disableIntentLink) {
        onIntentClick(e)
      }
      onClick?.()
    },
    [disableIntentLink, onClick, onIntentClick]
  )

  if (index === null) return null
  if (!type) return null

  return (
    <PreviewCard
      as={CommandListItem}
      data-as="a"
      data-command-list-item
      flex={1}
      onClick={handleClick}
      onMouseDown={onChildMouseDown}
      onMouseEnter={onChildMouseEnter(index)}
      padding={2}
      radius={2}
      tabIndex={-1}
      {...rest}
    >
      <SearchResultItemPreview
        documentId={documentId}
        presence={documentPresence}
        schemaType={type}
      />
    </PreviewCard>
  )
}
