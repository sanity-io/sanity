import {isPast} from 'date-fns'

import {type EditableReleaseDocument} from '../store/types'

/** @internal */
export const getIsScheduledDateInPast = (value: EditableReleaseDocument) =>
  Boolean(
    value.metadata.releaseType === 'scheduled' &&
      value.metadata.intendedPublishAt &&
      isPast(new Date(value.metadata.intendedPublishAt)),
  )
