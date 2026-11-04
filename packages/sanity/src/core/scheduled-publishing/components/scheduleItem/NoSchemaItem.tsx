import {red} from '@sanity/color'
import {UnknownIcon} from '@sanity/icons/Unknown'

import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {type Schedule} from '../../types'
import {FallbackContextMenu} from '../scheduleContextMenu/FallbackContextMenu'
import {type ScheduleValidationListener} from '../validation/SchedulesValidation'
import PreviewWrapper from './PreviewWrapper'

const NoSchemaItem = ({
  schedule,
  validationListener,
}: {
  schedule: Schedule
  validationListener: ScheduleValidationListener
}) => {
  return (
    <PreviewWrapper
      contextMenu={<FallbackContextMenu schedule={schedule} />}
      schedule={schedule}
      useElementQueries
      validationListener={validationListener}
    >
      <SanityDefaultPreview
        icon={UnknownIcon}
        layout="default"
        subtitle={<em>It may have been deleted</em>}
        title={<em style={{color: red[600].hex}}>Document not found</em>}
      />
    </PreviewWrapper>
  )
}

export default NoSchemaItem
