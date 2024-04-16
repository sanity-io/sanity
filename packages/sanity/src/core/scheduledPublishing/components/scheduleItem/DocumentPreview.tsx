import {type SchemaType} from '@sanity/types'
import {useMemo} from 'react'

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

  const {DialogScheduleEdit, dialogProps, dialogScheduleEditShow} = useDialogScheduleEdit(schedule)
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
      />
    </>
  )
}

export default DocumentPreview
