import type {SanityDocument, SchemaType} from '@sanity/types'
import React, {isValidElement} from 'react'
import {isNumber, isString} from 'lodash'
import {Inline, TooltipDelayGroupProvider} from '@sanity/ui'
import {useMemoObservable} from 'react-rx'
import {DocumentStatus} from '../../../ui/documentStatus'
import {TOOLTIP_DELAY_PROPS} from '../../../ui/tooltip/constants'
import type {PaneItemPreviewState} from './types'
import {
  DocumentPresence,
  DocumentPreviewPresence,
  DocumentPreviewStore,
  GeneralPreviewLayoutKey,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  SanityDefaultPreview,
  isRecord,
} from 'sanity'

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  icon: React.ComponentType | false
  layout: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
  value: SanityDocument
}

export function PaneItemPreview(props: PaneItemPreviewProps) {
  const {icon, layout, presence, schemaType, value} = props
  const title =
    (isRecord(value.title) && isValidElement(value.title)) ||
    isString(value.title) ||
    isNumber(value.title)
      ? value.title
      : null

  // NOTE: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {draft, published, isLoading} = useMemoObservable<PaneItemPreviewState>(
    () => getPreviewStateObservable(props.documentPreviewStore, schemaType, value._id, title),
    [props.documentPreviewStore, schemaType, value._id, title],
  )!

  const status = isLoading ? null : (
    <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
      <Inline space={4}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        <DocumentStatus document={published} type="published" />
        <DocumentStatus document={draft} type="draft" />
      </Inline>
    </TooltipDelayGroupProvider>
  )

  return (
    <SanityDefaultPreview
      {...getPreviewValueWithFallback({value, draft, published})}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
    />
  )
}
