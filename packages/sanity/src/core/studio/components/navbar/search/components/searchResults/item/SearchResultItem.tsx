import {Box, ResponsiveMarginProps, ResponsivePaddingProps} from '@sanity/ui'
import React, {MouseEvent, useCallback, useMemo} from 'react'
import {PreviewCard} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import {useDocumentPresence} from '../../../../../../../store'
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

  const params = useMemo(() => ({id: documentId, type: type?.name}), [documentId, type?.name])
  const {onClick: onIntentClick, href} = useIntentLink({
    intent: 'edit',
    params,
  })

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!disableIntentLink) {
        onIntentClick(e)
      }
      onClick?.()
    },
    [disableIntentLink, onClick, onIntentClick],
  )

  if (!type) return null

  return (
    <Box {...rest}>
      <PreviewCard
        as="a"
        data-as="a"
        flex={1}
        href={disableIntentLink ? undefined : href}
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
