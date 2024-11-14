import {type SanityDocumentLike} from '@sanity/types'
import {Box, type ResponsiveMarginProps, type ResponsivePaddingProps} from '@sanity/ui'
import {type MouseEvent, useCallback, useMemo} from 'react'
import {getPublishedId, useSearchState} from 'sanity'
import {useIntentLink, useRouter} from 'sanity/router'

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
  const perspective = useRouter().stickyParams.perspective
  const params = useMemo(() => ({id: documentId, type: type?.name}), [documentId, type?.name])
  const {onClick: onIntentClick, href} = useIntentLink({
    intent: 'edit',
    params,
  })
  const {state} = useSearchState()

  /**
   * if it exists in the release then it means that this component is being used
   * in the context of the release tool where we need to avoid pressing items that are already in the release
   */
  const existsInRelease = state.idsInRelease?.some((id) => id.includes(getPublishedId(documentId)))

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!existsInRelease) {
        onItemSelect?.({_id: documentId, _type: documentType})
        if (!disableIntentLink) {
          onIntentClick(e)
        }
        onClick?.()
      }
    },
    [
      onItemSelect,
      documentId,
      documentType,
      disableIntentLink,
      existsInRelease,
      onClick,
      onIntentClick,
    ],
  )

  if (!type) return null

  return (
    <Box {...rest}>
      <PreviewCard
        as="a"
        data-as="a"
        flex={1}
        href={disableIntentLink || existsInRelease ? undefined : href}
        onClick={handleClick}
        radius={2}
        tabIndex={-1}
        style={{
          pointerEvents: existsInRelease ? 'none' : undefined,
          opacity: existsInRelease ? 0.5 : 1,
        }}
      >
        <SearchResultItemPreview
          documentId={documentId}
          layout={layout}
          perspective={state.perspective ?? perspective}
          presence={documentPresence}
          schemaType={type}
        />
      </PreviewCard>
    </Box>
  )
}
