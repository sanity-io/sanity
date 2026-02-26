import {type EditableReleaseDocument} from '@sanity/client'
import {isPast} from 'date-fns/isPast'

/** @internal */
export const getIsScheduledDateInPast = (value: EditableReleaseDocument) =>
  Boolean(
    value.metadata.releaseType === 'scheduled' &&
    value.metadata.intendedPublishAt &&
    isPast(new Date(value.metadata.intendedPublishAt)),
  )
