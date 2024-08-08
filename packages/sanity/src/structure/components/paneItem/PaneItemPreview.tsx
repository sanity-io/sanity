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
  getDocumentIsInPerspective,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  isRecord,
  SanityDefaultPreview,
} from 'sanity'
import {styled} from 'styled-components'

import {TooltipDelayGroupProvider} from '../../../ui-components'

const Root = styled.div<{$isInPerspective: boolean}>`
  opacity: ${(props) => (props.$isInPerspective ? 1 : 0.5)};
`

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  icon: ComponentType | false
  perspective?: string
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
  const {icon, layout, perspective, presence, schemaType, value} = props
  const title =
    (isRecord(value.title) && isValidElement(value.title)) ||
    isString(value.title) ||
    isNumber(value.title)
      ? value.title
      : null

  const previewStateObservable = useMemo(
    () =>
      getPreviewStateObservable(
        props.documentPreviewStore,
        schemaType,
        value._id,
        title,
        perspective?.startsWith('bundle.') ? perspective.split('bundle.').at(1) : undefined,
      ),
    [props.documentPreviewStore, schemaType, title, value._id, perspective],
  )

  const {draft, published, version, isLoading} = useObservable(previewStateObservable, {
    draft: null,
    isLoading: true,
    published: null,
  })

  const isInPerspective = useMemo(
    () => getDocumentIsInPerspective(value._id, perspective),
    [perspective, value._id],
  )

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
    <Root $isInPerspective={isInPerspective}>
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({value, draft, published, version, perspective})}
        isPlaceholder={isLoading}
        icon={icon}
        layout={layout}
        status={status}
        tooltip={tooltip}
      />
    </Root>
  )
}
