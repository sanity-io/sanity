import {type SanityDocument, type SchemaType} from '@sanity/types'
import {Flex} from '@sanity/ui'
import {type ComponentType, useCallback, useMemo} from 'react'
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
  type PreviewProps,
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

  const tooltip = useMemo(
    () => (
      <DocumentStatus
        draft={versionsInfo.draft}
        published={versionsInfo.published}
        versions={versionsInfo.versions}
      />
    ),
    [versionsInfo.draft, versionsInfo.published, versionsInfo.versions],
  )

  // Check if the schema type has a custom preview component defined
  const CustomPreviewComponent = schemaType.components?.preview as
    | ComponentType<PreviewProps>
    | undefined

  const previewValue = getPreviewValueWithFallback({snapshot, original, fallback: value})

  // Callback to render the default preview, used when custom component calls renderDefault
  const renderDefault = useCallback(
    (defaultProps: PreviewProps) => (
      <SanityDefaultPreview {...defaultProps} icon={icon} tooltip={tooltip} />
    ),
    [icon, tooltip],
  )

  // If a custom preview component is defined, use it
  if (CustomPreviewComponent) {
    return (
      <CustomPreviewComponent
        {...previewValue}
        schemaType={schemaType}
        isPlaceholder={isLoading}
        layout={layout}
        status={status}
        renderDefault={renderDefault}
      />
    )
  }

  // Otherwise, use the default preview
  return (
    <SanityDefaultPreview
      {...previewValue}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
      tooltip={tooltip}
    />
  )
}
