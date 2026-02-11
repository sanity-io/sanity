import {
  type PrepareViewOptions,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {Flex} from '@sanity/ui'
import {type ComponentType, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  type DocumentPresence,
  DocumentPreviewPresence,
  type DocumentPreviewStore,
  DocumentStatus,
  DocumentStatusIndicator,
  type GeneralPreviewLayoutKey,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  SanityDefaultPreview,
  useDocumentVersionInfo,
  usePerspective,
} from 'sanity'

import {TooltipDelayGroupProvider} from '../../../ui-components'

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  icon: ComponentType | false
  layout: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
  sortOrder?: Pick<SortOrdering, 'by'>
  value: SanityDocument | {_id: string; _type: string}
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

  const versionsInfo = useDocumentVersionInfo(value._id)

  const {perspectiveStack} = usePerspective()
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
    )
  }, [props.documentPreviewStore, schemaType, value._id, perspectiveStack, viewOptions])

  const {
    snapshot,
    original,
    isLoading: previewIsLoading,
  } = useObservable(previewStateObservable, {
    snapshot: null,
    isLoading: true,
    original: null,
  })

  const isLoading = previewIsLoading

  const status = isLoading ? null : (
    <TooltipDelayGroupProvider>
      <Flex align="center" gap={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        <DocumentStatusIndicator
          draft={versionsInfo.draft}
          published={versionsInfo.published}
          versions={versionsInfo.versions}
        />
      </Flex>
    </TooltipDelayGroupProvider>
  )

  const tooltip = (
    <DocumentStatus
      draft={versionsInfo.draft}
      published={versionsInfo.published}
      versions={versionsInfo.versions}
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
    />
  )
}
