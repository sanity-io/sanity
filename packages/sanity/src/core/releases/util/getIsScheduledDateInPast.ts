import {isPast} from 'date-fns'

import {type EditableStudioReleaseDocument} from '../types'

/** @internal */
export const getIsScheduledDateInPast = (value: EditableStudioReleaseDocument) =>
  Boolean(
    value.metadata.releaseType === 'scheduled' &&
      value.metadata.intendedPublishAt &&
      isPast(new Date(value.metadata.intendedPublishAt)),
  )
