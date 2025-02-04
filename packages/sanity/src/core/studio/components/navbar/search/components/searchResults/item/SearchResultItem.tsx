import {type SanityDocumentLike} from '@sanity/types'
import {Box, type ResponsiveMarginProps, type ResponsivePaddingProps} from '@sanity/ui'
import {type MouseEvent, useCallback, useMemo} from 'react'
import {useIntentLink, useRouter} from 'sanity/router'

import {Tooltip} from '../../../../../../../../ui-components'
import {type GeneralPreviewLayoutKey, PreviewCard} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import {useTranslation} from '../../../../../../../i18n/hooks/useTranslation'
import {unstable_useValuePreview as useValuePreview} from '../../../../../../../preview/useValuePreview'
import {useDocumentPresence} from '../../../../../../../store'
import {getPublishedId} from '../../../../../../../util/draftUtils'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {SearchResultItemPreview} from './SearchResultItemPreview'

export type ItemSelectHandler = (item: Pick<SanityDocumentLike, '_id' | '_type' | 'title'>) => void

interface SearchResultItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  disableIntentLink?: boolean
  documentId: string
  documentType: string
  layout?: GeneralPreviewLayoutKey
  onClick?: (e: MouseEvent<HTMLElement>) => void
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
  const {t} = useTranslation()

  // if the perspective is set within the searchState then it means it should override the router perspective
  const pickedPerspective = state.perspective ? state.perspective[0] : perspective

  // the current search result exists in the release provided by the search provider
  const existsInRelease = state.disabledDocumentIds?.some((id) =>
    id.includes(getPublishedId(documentId)),
  )

  const preview = useValuePreview({
    enabled: true,
    schemaType: type,
    value: {_id: documentId},
  })

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      onItemSelect?.({_id: documentId, _type: documentType, title: preview.value?.title})
      if (!disableIntentLink) {
        onIntentClick(e)
      }
      onClick?.(e)
    },
    [preview, onItemSelect, documentId, documentType, disableIntentLink, onClick, onIntentClick],
  )

  if (!type) return null

  const content = (
    <Box {...rest}>
      <PreviewCard
        as={existsInRelease ? undefined : 'a'}
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
          perspective={pickedPerspective}
          presence={documentPresence}
          schemaType={type}
        />
      </PreviewCard>
    </Box>
  )

  return existsInRelease ? (
    <Tooltip content={t('release.tooltip.already-added')} placement="top">
      {content}
    </Tooltip>
  ) : (
    content
  )
}
