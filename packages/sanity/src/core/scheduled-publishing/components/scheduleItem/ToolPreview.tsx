import {type SchemaType} from '@sanity/types'
import {type ComponentType, type ReactNode, type Ref, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {Preview} from '../../../preview/components/Preview'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {getPublishedId} from '../../../util/draftUtils'
import {SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE} from '../../constants'
import useDialogScheduleEdit from '../../hooks/useDialogScheduleEdit'
import {usePublishedId} from '../../hooks/usePublishedId'
import {type Schedule} from '../../types'
import {type PaneItemPreviewState} from '../../utils/paneItemHelpers'
import {ScheduleContextMenu} from '../scheduleContextMenu'
import PreviewWrapper from './PreviewWrapper'

interface Props {
  previewState: PaneItemPreviewState
  schedule: Schedule
  schemaType: SchemaType
}

const ToolPreview = (props: Props) => {
  const {previewState, schedule, schemaType} = props
  const timeZoneScope = SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE

  const visibleDocument = previewState.draft || previewState.published
  const isCompleted = schedule.state === 'succeeded'
  const isScheduled = schedule.state === 'scheduled'

  const {DialogScheduleEdit, dialogProps, dialogScheduleEditShow} = useDialogScheduleEdit(
    schedule,
    timeZoneScope,
  )

  const publishedId = usePublishedId(visibleDocument?._id)

  const LinkComponent = useMemo(() => {
    function Component(linkProps: {children?: ReactNode; ref?: Ref<HTMLAnchorElement>}) {
      const {ref, ...rest} = linkProps
      const publishedDocId = visibleDocument ? getPublishedId(visibleDocument._id) : undefined
      return (
        <IntentLink
          {...rest}
          intent="edit"
          params={{
            type: schemaType.name,
            ...(publishedDocId ? {id: publishedDocId} : {}),
          }}
          ref={ref}
        />
      )
    }
    // oxlint-disable-next-line react/immutability -- displayName assignment on render-local component
    Component.displayName = 'LinkComponent'
    return Component
  }, [schemaType, visibleDocument])

  return (
    <>
      {/* Dialogs (rendered outside of cards so they don't infer card colors) */}
      {DialogScheduleEdit && <DialogScheduleEdit {...dialogProps} />}
      <PreviewWrapper
        contextMenu={
          <ScheduleContextMenu
            actions={{
              clear: isCompleted,
              delete: !isCompleted,
              edit: isScheduled,
              execute: isScheduled,
            }}
            onEdit={dialogScheduleEditShow}
            schedule={schedule}
            schemaType={schemaType}
          />
        }
        linkComponent={LinkComponent}
        publishedDocumentId={publishedId}
        schedule={schedule}
        schemaType={schemaType}
        useElementQueries
      >
        {previewState.isLoading ? (
          <SanityDefaultPreview
            icon={schemaType?.icon as ComponentType}
            isPlaceholder={previewState.isLoading}
            layout="default"
          />
        ) : (
          <Preview layout="default" schemaType={schemaType} value={visibleDocument} />
        )}
      </PreviewWrapper>
    </>
  )
}

export default ToolPreview
