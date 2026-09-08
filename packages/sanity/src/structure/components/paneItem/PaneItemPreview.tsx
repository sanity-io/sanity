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
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  getPublishedId,
  SanityDefaultPreview,
  useDocumentVersions,
  usePerspective,
} from 'sanity'
import {Flex} from 'ui5'

import {TooltipDelayGroupProvider} from '../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
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
  const {icon, layout, presence, schemaType, sortOrder, value} = props

  const publishedId = getPublishedId(value._id)
  const {versions} = useDocumentVersions({documentId: publishedId})

  const {perspectiveStack, selectedVariantName} = usePerspective()
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

  // Deferred: react-rx v5's deferral is identity-coherent, so when a
  // (recycled) list item switches to a new document id the live snapshot for
  // the new id wins and the previous document's title/media never renders
  // next to the new document's version badges.
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
        <DocumentVersionsStatusIndicator documentVersions={versions} />
      </Flex>
    </TooltipDelayGroupProvider>
  )

  const tooltip = <DocumentVersionsStatus documentGroupId={publishedId} />

  return (
    <SanityDefaultPreview
      {...getPreviewValueWithFallback({snapshot, original, fallback: value})}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
      tooltip={tooltip}
    />
  )
}
