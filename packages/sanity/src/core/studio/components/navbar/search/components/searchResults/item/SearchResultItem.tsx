import {type StackablePerspective} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {Box, type ResponsiveMarginProps, type ResponsivePaddingProps} from '@sanity/ui'
import {type MouseEvent, useCallback, useEffect, useMemo, useState} from 'react'
import {useIntentLink} from 'sanity/router'

import {Tooltip} from '../../../../../../../../ui-components'
import {type GeneralPreviewLayoutKey, PreviewCard} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import {useTranslation} from '../../../../../../../i18n/hooks/useTranslation'
import {unstable_useValuePreview as useValuePreview} from '../../../../../../../preview/useValuePreview'
import {
  type PermissionCheckResult,
  useDocumentPresence,
  useGrantsStore,
} from '../../../../../../../store'
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
  previewPerspective?: StackablePerspective[]
}

export function SearchResultItem({
  disableIntentLink,
  documentId,
  documentType,
  layout,
  onClick,
  onItemSelect,
  previewPerspective,
  ...rest
}: SearchResultItemProps) {
  const schema = useSchema()
  const type = schema.get(documentType)
  const documentPresence = useDocumentPresence(documentId)
  const params = useMemo(
    () => ({id: getPublishedId(documentId), type: type?.name}),
    [documentId, type?.name],
  )

  const {onClick: onIntentClick, href} = useIntentLink({
    intent: 'edit',
    params,
  })
  const {state} = useSearchState()
  const {t} = useTranslation()
  const grantsStore = useGrantsStore()
  const [createPermission, setCreatePermission] = useState<PermissionCheckResult | null>(null)
  const hasCreatePermission = createPermission?.granted

  useEffect(() => {
    if (state.canDisableAction) {
      grantsStore
        .checkDocumentPermission('create', {_id: documentId, _type: documentType})
        .subscribe(setCreatePermission)
    }
  }, [documentId, documentType, grantsStore, state.canDisableAction])

  // the current search result exists in the release provided by the search provider
  const existsInRelease = state.disabledDocumentIds?.some((id) =>
    id.includes(getPublishedId(documentId)),
  )
  // should the search items be disasabled
  const disabledAction = (!hasCreatePermission && state.canDisableAction) || existsInRelease

  const documentStub = useMemo(
    () => ({_id: documentId, _type: documentType}),
    [documentId, documentType],
  )
  const preview = useValuePreview({
    enabled: true,
    schemaType: type,
    value: documentStub,
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
        as={disabledAction ? undefined : 'a'}
        data-as="a"
        flex={1}
        href={disabledAction || disableIntentLink ? undefined : href}
        onClick={handleClick}
        radius={2}
        tabIndex={-1}
        style={{
          pointerEvents: disabledAction ? 'none' : undefined,
          opacity: disabledAction ? 0.5 : 1,
        }}
      >
        <SearchResultItemPreview
          documentId={documentId}
          documentType={documentType}
          layout={layout}
          perspective={previewPerspective}
          presence={documentPresence}
          schemaType={type}
        />
      </PreviewCard>
    </Box>
  )

  const tooltipContent = existsInRelease
    ? t('search.disabledItem')
    : t('release.action.permission.error')

  return disabledAction ? (
    <Tooltip content={tooltipContent} placement="top">
      {content}
    </Tooltip>
  ) : (
    content
  )
}
