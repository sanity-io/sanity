import {Box, ResponsiveMarginProps, ResponsivePaddingProps} from '@sanity/ui'
import React, {MouseEvent, useCallback} from 'react'
import {PreviewCard} from '../../../../../../../components/PreviewCard'
import {useSchema} from '../../../../../../../hooks'
import {useDocumentPresence} from '../../../../../../../store'
import {CommandListItem} from '../../common/CommandListItem.styled'
import SearchResultItemPreview from './SearchResultItemPreview'
import {useIntentLink} from 'sanity/router'

interface SearchResultItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  compact?: boolean
  disableIntentLink?: boolean
  documentId: string
  documentType: string
  onClick?: () => void
}

export function SearchResultItem({
  compact,
  disableIntentLink,
  documentId,
  documentType,
  onClick,
  ...rest
}: SearchResultItemProps) {
  const schema = useSchema()
  const type = schema.get(documentType)
  const documentPresence = useDocumentPresence(documentId)

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

  if (!type) return null

  return (
    <Box {...rest}>
      <PreviewCard
        as={CommandListItem}
        data-as="a"
        data-command-list-item
        flex={1}
        onClick={handleClick}
        padding={compact ? 1 : 2}
        radius={2}
        tabIndex={-1}
      >
        <SearchResultItemPreview
          documentId={documentId}
          presence={documentPresence}
          schemaType={type}
        />
      </PreviewCard>
    </Box>
  )
}
