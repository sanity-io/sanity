import {type EditableStudioReleaseDocument} from '../types'
import {isPast} from 'date-fns'

/** @internal */
export const getIsScheduledDateInPast = (value: EditableStudioReleaseDocument) =>
  Boolean(
    value.metadata.releaseType === 'scheduled' &&
      value.metadata.intendedPublishAt &&
      isPast(new Date(value.metadata.intendedPublishAt)),
  )
