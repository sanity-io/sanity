import {type SchemaType} from '@sanity/types'
import {useMemo} from 'react'

import {SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE} from '../../constants'
import {useDocumentActionProps} from '../../contexts/documentActionProps'
import useDialogScheduleEdit from '../../hooks/useDialogScheduleEdit'
import {type Schedule} from '../../types'
import {getScheduledDocumentId} from '../../utils/paneItemHelpers'
import {ScheduleContextMenu} from '../scheduleContextMenu'
import PreviewWrapper from './PreviewWrapper'

interface Props {
  schedule: Schedule
  schemaType: SchemaType
}

const DocumentPreview = (props: Props) => {
  const {schedule, schemaType} = props
  const timeZoneScope = SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE

  const {DialogScheduleEdit, dialogProps, dialogScheduleEditShow} = useDialogScheduleEdit(
    schedule,
    timeZoneScope,
  )
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {onComplete} = useDocumentActionProps()
  const publishedId = useMemo(() => getScheduledDocumentId(schedule), [schedule])

  return (
    <>
      {/* Dialogs (rendered outside of cards so they don't infer card colors) */}
      {DialogScheduleEdit && <DialogScheduleEdit {...dialogProps} />}

      <PreviewWrapper
        contextMenu={
          <ScheduleContextMenu
            actions={{
              delete: true,
              edit: true,
            }}
            onDelete={onComplete}
            onEdit={dialogScheduleEditShow}
            schedule={schedule}
            schemaType={schemaType}
          />
        }
        onClick={dialogScheduleEditShow}
        publishedDocumentId={publishedId}
        schedule={schedule}
        schemaType={schemaType}
        // the document's pane has its pair checked out, so share the pane's validation
        validationListener="document"
      />
    </>
  )
}

export default DocumentPreview
