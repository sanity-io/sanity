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
  getBundleIdFromReleaseId,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  isRecord,
  SanityDefaultPreview,
  useReleases,
} from 'sanity'

import {TooltipDelayGroupProvider} from '../../../ui-components'

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

  const releases = useReleases()

  const previewStateObservable = useMemo(
    () =>
      getPreviewStateObservable(props.documentPreviewStore, schemaType, value._id, title, {
        bundleIds: (releases.data ?? []).map((release) => getBundleIdFromReleaseId(release._id)),
        bundleStack: releases.stack,
      }),
    [props.documentPreviewStore, schemaType, value._id, title, releases.data, releases.stack],
  )

  const {
    draft,
    published,
    version,
    versions,
    isLoading: previewIsLoading,
  } = useObservable(previewStateObservable, {
    draft: null,
    isLoading: true,
    published: null,
    version: null,
    versions: {},
    perspective,
  })

  const isLoading = previewIsLoading || releases.loading

  const status = isLoading ? null : (
    <TooltipDelayGroupProvider>
      <Flex align="center" gap={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        <DocumentStatusIndicator
          draft={draft}
          published={published}
          version={version}
          versions={versions}
        />
      </Flex>
    </TooltipDelayGroupProvider>
  )

  const tooltip = (
    <DocumentStatus draft={draft} published={published} version={version} versions={versions} />
  )

  return (
    <SanityDefaultPreview
      {...getPreviewValueWithFallback({value, draft, published, version, perspective})}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
      tooltip={tooltip}
    />
  )
}
