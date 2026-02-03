import {useMemo} from 'react'

import usePreviewState from '../../hooks/usePreviewState'
import {useScheduleSchemaType} from '../../hooks/useSchemaType'
import {type Schedule} from '../../types'
import {getScheduledDocument} from '../../utils/paneItemHelpers'
import DateWithTooltipElementQuery from './dateWithTooltip/DateWithTooltipElementQuery'
import DocumentPreview from './DocumentPreview'
import NoSchemaItem from './NoSchemaItem'
import ToolPreview from './ToolPreview'

interface Props {
  schedule: Schedule
  type: 'document' | 'tool'
}

export const ScheduleItem = (props: Props) => {
  const {schedule, type} = props

  const firstDocument = getScheduledDocument(schedule)

  const schemaType = useScheduleSchemaType(schedule)
  const previewState = usePreviewState(firstDocument?.documentId, schemaType)

  const visibleDocument = previewState.draft || previewState.published
  const invalidDocument = !visibleDocument && !previewState.isLoading

  const preview = useMemo(() => {
    if (!schemaType || invalidDocument) {
      return <NoSchemaItem schedule={schedule} />
    }

    if (type === 'document') {
      return <DocumentPreview schedule={schedule} schemaType={schemaType} />
    }

    if (type === 'tool') {
      return <ToolPreview previewState={previewState} schedule={schedule} schemaType={schemaType} />
    }

    return null
  }, [invalidDocument, type, previewState, schedule, schemaType])

  return <DateWithTooltipElementQuery>{preview}</DateWithTooltipElementQuery>
}
