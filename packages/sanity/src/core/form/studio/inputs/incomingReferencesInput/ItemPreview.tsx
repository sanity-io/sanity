import {type SanityDocument, type SchemaType} from '@sanity/types'
import {Flex} from '@sanity/ui'
import {type ComponentType, useMemo} from 'react'
import {useObservable} from 'react-rx'

import {TooltipDelayGroupProvider} from '../../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {DocumentStatus} from '../../../../components/documentStatus/DocumentStatus'
import {DocumentStatusIndicator} from '../../../../components/documentStatusIndicator/DocumentStatusIndicator'
import {type GeneralPreviewLayoutKey} from '../../../../components/previews/types'
import {usePerspective} from '../../../../perspective/usePerspective'
import {DocumentPreviewPresence} from '../../../../presence/DocumentPreviewPresence'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {type DocumentPreviewStore} from '../../../../preview/documentPreviewStore'
import {getPreviewStateObservable} from '../../../../preview/utils/getPreviewStateObservable'
import {getPreviewValueWithFallback} from '../../../../preview/utils/getPreviewValueWithFallback'
import {useDocumentVersionInfo} from '../../../../releases/store/useDocumentVersionInfo'
import {type DocumentPresence} from '../../../../store/_legacy/presence/types'

export interface ItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  icon: ComponentType | false
  layout: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
  value: SanityDocument
}

/**
 * Preview component for documents rendered in incoming references input.
 */
export function ItemPreview(props: ItemPreviewProps) {
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

  const {snapshot, original, isLoading} = useObservable(previewStateObservable, {
    snapshot: null,
    isLoading: true,
    original: null,
  })

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
