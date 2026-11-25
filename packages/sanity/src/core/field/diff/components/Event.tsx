import {type ObjectSchemaType} from '@sanity/types'

import {type ObjectDiff} from '../../types'
import {ChangedFieldTitles} from './ChangedFieldTitles'
import {EventSummary, type EventSummaryProps} from './EventSummary'

/**
 * @internal
 */
export function Event({
  changes,
  ...props
}: Omit<EventSummaryProps, 'changedFields'> & {
  /** What the event changed, to list the titles of the changed fields next to its label. */
  changes?: {diff: ObjectDiff; schemaType: ObjectSchemaType}
}) {
  return (
    <EventSummary
      {...props}
      changedFields={
        changes && <ChangedFieldTitles diff={changes.diff} schemaType={changes.schemaType} />
      }
    />
  )
}
