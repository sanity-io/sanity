import {type SchemaType} from '@sanity/types'
import {type ComponentType} from 'react'
import {IntentLink} from 'sanity/router'

import {Preview} from '../../../preview/components/Preview'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {getPublishedId} from '../../../util/draftUtils'
import {SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE} from '../../constants'
import useDialogScheduleEdit from '../../hooks/useDialogScheduleEdit'
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
  const publishedDocId = visibleDocument ? getPublishedId(visibleDocument._id) : undefined

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
        linkComponent={IntentLink}
        linkProps={{
          intent: 'edit',
          params: {
            type: schemaType.name,
            ...(publishedDocId ? {id: publishedDocId} : {}),
          },
        }}
        publishedDocumentId={publishedDocId}
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
