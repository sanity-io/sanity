import {SanityDocument, SchemaType} from '@sanity/types'
import React, {isValidElement} from 'react'
import {isNumber, isString} from 'lodash'
import {Inline} from '@sanity/ui'
import {useMemoObservable} from 'react-rx'
import {PublishedStatus} from '../PublishedStatus'
import {DraftStatus} from '../DraftStatus'
import {GeneralPreviewLayoutKey} from '../../../components/previews'
import {DocumentPreviewPresence} from '../../../presence'
import {DocumentPreviewStore, SanityDefaultPreview} from '../../../preview'
import {isRecord} from '../../../util'
import {DocumentPresence} from '../../../datastores'
import {PaneItemPreviewState} from './types'
import {getPreviewStateObservable, getValueWithFallback} from './helpers'

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  icon: React.ElementType | false
  layout: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
  value: SanityDocument
}

export function PaneItemPreview(props: PaneItemPreviewProps) {
  const {icon, layout, presence, schemaType, value} = props
  // const {title} = value
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
    [props.documentPreviewStore, schemaType, value._id, title]
  )!

  const status = isLoading ? null : (
    <Inline space={4}>
      {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
      <PublishedStatus document={published} />
      <DraftStatus document={draft} />
    </Inline>
  )

  return (
    <SanityDefaultPreview
      {...getValueWithFallback({value, draft, published})}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
    />
  )
}
