import {type SanityDocumentLike} from '@sanity/types'
import {Box, type ResponsiveMarginProps, type ResponsivePaddingProps} from '@sanity/ui'
import {type MouseEvent, useCallback, useMemo} from 'react'
import {useIntentLink} from 'sanity/router'

import {type GeneralPreviewLayoutKey, PreviewCard} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import {useDocumentPresence} from '../../../../../../../store'
import {SearchResultItemPreview} from './SearchResultItemPreview'

export type ItemSelectHandler = (item: Pick<SanityDocumentLike, '_id' | '_type'>) => void

interface SearchResultItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  disableIntentLink?: boolean
  documentId: string
  documentType: string
  layout?: GeneralPreviewLayoutKey
  onClick?: () => void
  onItemSelect?: ItemSelectHandler
}

export function SearchResultItem({
  disableIntentLink,
  documentId,
  documentType,
  layout,
  onClick,
  onItemSelect,
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
      onItemSelect?.({_id: documentId, _type: documentType})
      if (!disableIntentLink) {
        onIntentClick(e)
      }
      onClick?.()
    },
    [onItemSelect, documentId, documentType, disableIntentLink, onClick, onIntentClick],
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
        radius={2}
        tabIndex={-1}
      >
        <SearchResultItemPreview
          documentId={documentId}
          layout={layout}
          presence={documentPresence}
          schemaType={type}
        />
      </PreviewCard>
    </Box>
  )
}
