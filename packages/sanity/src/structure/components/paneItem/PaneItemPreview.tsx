import {type SanityDocument, type SchemaType} from '@sanity/types'
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
  value: SanityDocument
}

/**
 * Preview component for _documents_ rendered in structure panes.
 *
 * Note that non-document previews are not handled by this component,
 * despite being pane items! Non-document previews bypass this entirely
 * and are rendered by `<SanityDefaultPreview>`.
 */
export function PaneItemPreview(props: PaneItemPreviewProps) {
  const {icon, layout, presence, schemaType, value} = props

  const versionsInfo = useDocumentVersionInfo(value._id)

  const {perspectiveStack} = usePerspective()
  const previewStateObservable = useMemo(() => {
    return getPreviewStateObservable(
      props.documentPreviewStore,
      schemaType,
      value._id,
      perspectiveStack,
    )
  }, [props.documentPreviewStore, schemaType, value._id, perspectiveStack])

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
