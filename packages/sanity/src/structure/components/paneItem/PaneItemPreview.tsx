import {type SanityDocument, type SchemaType} from '@sanity/types'
import {Flex} from '@sanity/ui'
import {isNumber, isString} from 'lodash'
import {type ComponentType, isValidElement, useMemo} from 'react'
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
  isRecord,
  SanityDefaultPreview,
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
  const title =
    (isRecord(value.title) && isValidElement(value.title)) ||
    isString(value.title) ||
    isNumber(value.title)
      ? value.title
      : null

  const previewStateObservable = useMemo(
    () => getPreviewStateObservable(props.documentPreviewStore, schemaType, value._id, title),
    [props.documentPreviewStore, schemaType, title, value._id],
  )
  const {draft, published, isLoading} = useObservable(previewStateObservable, {
    draft: null,
    isLoading: true,
    published: null,
  })

  const status = isLoading ? null : (
    <TooltipDelayGroupProvider>
      <Flex align="center" gap={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        <DocumentStatusIndicator draft={draft} published={published} />
      </Flex>
    </TooltipDelayGroupProvider>
  )

  const tooltip = <DocumentStatus draft={draft} published={published} />

  return (
    <SanityDefaultPreview
      {...getPreviewValueWithFallback({value, draft, published})}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
      tooltip={tooltip}
    />
  )
}
