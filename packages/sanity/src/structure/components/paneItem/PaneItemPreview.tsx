import {
  type PrepareViewOptions,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {type ComponentType, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  type DocumentPresence,
  DocumentPreviewPresence,
  type DocumentPreviewStore,
  DocumentVersionsStatus,
  DocumentVersionsStatusIndicator,
  type GeneralPreviewLayoutKey,
  getDefaultVariant,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  getPublishedId,
  SanityDefaultPreview,
  useDocumentVersions,
  usePerspective,
  useTranslation,
  useWorkspace,
} from 'sanity'
import {Box, Flex, Text} from 'ui5'

import {TooltipDelayGroupProvider} from '../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {structureLocaleNamespace} from '../../i18n'
import {PaneItemVersionsLink} from './PaneItemVersionsLink'

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  /**
   * The child id the row links to. When it is set and the document group inventory is enabled,
   * a click on the status icons opens the document with the inventory open.
   */
  inventoryChildId?: string
  icon: ComponentType | false
  layout: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
  sortOrder?: Pick<SortOrdering, 'by'>
  value: SanityDocument | {_id: string; _type: string}
}

const INITIAL_PREVIEW_STATE = {
  snapshot: null,
  isLoading: true,
  original: null,
}

/**
 * Preview component for _documents_ rendered in structure panes.
 *
 * Note that non-document previews are not handled by this component,
 * despite being pane items! Non-document previews bypass this entirely
 * and are rendered by `<SanityDefaultPreview>`.
 */
export function PaneItemPreview(props: PaneItemPreviewProps) {
  const {icon, inventoryChildId, layout, presence, schemaType, sortOrder, value} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const inventoryEnabled = useWorkspace().beta?.documentGroupInventory?.enabled === true
  const versionsLinkChildId = inventoryEnabled ? inventoryChildId : undefined

  const publishedId = getPublishedId(value._id)
  const {versions} = useDocumentVersions({documentId: publishedId})

  const {perspectiveStack, selectedVariantNames} = usePerspective()
  const selectedVariantName = getDefaultVariant(selectedVariantNames)
  const viewOptions = useMemo((): PrepareViewOptions | undefined => {
    if (!sortOrder) return undefined
    return {
      ordering: {
        title: '',
        name: '',
        by: sortOrder.by,
      },
    }
  }, [sortOrder])
  const previewStateObservable = useMemo(() => {
    return getPreviewStateObservable(
      props.documentPreviewStore,
      schemaType,
      value._id,
      perspectiveStack,
      viewOptions,
      selectedVariantName,
    )
  }, [
    props.documentPreviewStore,
    schemaType,
    value._id,
    perspectiveStack,
    viewOptions,
    selectedVariantName,
  ])

  const {
    snapshot,
    original,
    isLoading: previewIsLoading,
  } = useObservable(previewStateObservable, INITIAL_PREVIEW_STATE)

  const isLoading = previewIsLoading

  const status = isLoading ? null : (
    <TooltipDelayGroupProvider>
      <Flex alignItems="center" gap={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        {versionsLinkChildId ? (
          <PaneItemVersionsLink childId={versionsLinkChildId}>
            <DocumentVersionsStatusIndicator documentVersions={versions} />
          </PaneItemVersionsLink>
        ) : (
          <DocumentVersionsStatusIndicator documentVersions={versions} />
        )}
      </Flex>
    </TooltipDelayGroupProvider>
  )

  const tooltip = (
    <DocumentVersionsStatus
      documentGroupId={publishedId}
      footer={
        versionsLinkChildId ? (
          <Box paddingY={2} paddingLeft={3} paddingRight={2}>
            <Text muted size={1}>
              {t('pane-item.versions-status.open-inventory.hint')}
            </Text>
          </Box>
        ) : undefined
      }
    />
  )

  return (
    <SanityDefaultPreview
      {...getPreviewValueWithFallback({snapshot, original, fallback: value})}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
      tooltip={tooltip}
      tooltipPlacement="beside"
    />
  )
}
