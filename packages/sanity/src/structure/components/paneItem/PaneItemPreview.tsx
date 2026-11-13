import {
  type PrepareViewOptions,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {type ComponentType, useContext, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  type DocumentPresence,
  DocumentPreviewPresence,
  type DocumentPreviewStore,
  DocumentVersionsFlyoutList,
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
  useWorkspace,
} from 'sanity'
import {PreviewCardContext} from 'sanity/_singletons'
import {Flex} from 'ui5'

import {TooltipDelayGroupProvider} from '../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {getCreateVariantPaneParams} from './getCreateVariantPaneParams'
import {PaneItemVersionsFlyout, type PaneItemVersionsFlyoutActions} from './PaneItemVersionsFlyout'

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  /**
   * The child id the row links to. When it is set and the document group inventory is enabled,
   * hovering the row opens a flyout of the document's versions, which open the document with the
   * inventory open.
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
  const inventoryEnabled = useWorkspace().beta?.documentGroupInventory?.enabled === true
  const versionsLinkChildId = inventoryEnabled ? inventoryChildId : undefined

  const publishedId = getPublishedId(value._id)
  const {versions} = useDocumentVersions({documentId: publishedId})
  const rowSelected = useContext(PreviewCardContext)?.selected
  const {perspectiveStack, selectedPerspective, selectedVariantNames} = usePerspective()
  // A variant with no version in the release in view opens with Manage versions ready to create it
  // there, instead of the document falling back to another version.
  const renderFlyoutList = (actions: PaneItemVersionsFlyoutActions) => (
    <DocumentVersionsFlyoutList
      documentGroupId={publishedId}
      viewingDocument={Boolean(rowSelected)}
      onOpenInventory={actions.onOpenInventory}
      onPick={(variantId) =>
        actions.onPick(
          variantId,
          getCreateVariantPaneParams({variantId, selectedPerspective, versions}),
        )
      }
    />
  )

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
          <PaneItemVersionsFlyout childId={versionsLinkChildId} renderList={renderFlyoutList}>
            <DocumentVersionsStatusIndicator documentVersions={versions} />
          </PaneItemVersionsFlyout>
        ) : (
          <DocumentVersionsStatusIndicator documentVersions={versions} />
        )}
      </Flex>
    </TooltipDelayGroupProvider>
  )

  // With the inventory on, the flyout of the row replaces the read-only versions popover.
  const tooltip = versionsLinkChildId ? undefined : (
    <DocumentVersionsStatus documentGroupId={publishedId} />
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
