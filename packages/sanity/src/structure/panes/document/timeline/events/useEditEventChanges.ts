import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type EditDocumentVersionEvent, useEvents} from 'sanity'

const INITIAL_CHANGES = {loading: true, diff: null, error: null}

/** The transactions of an edit event, from the oldest to the newest (one for a listed transaction). */
export function getEditEventRange(event: EditDocumentVersionEvent) {
  return {
    fromRevisionId: event.transactions.at(-1)?.revisionId ?? event.revisionId,
    toRevisionId: event.revisionId,
  }
}

/** What an edit event changed: the changes of its transactions. */
export function useEditEventChanges(event: EditDocumentVersionEvent) {
  const {getEditChanges} = useEvents()
  const {fromRevisionId, toRevisionId} = getEditEventRange(event)
  const changes$ = useMemo(
    () => getEditChanges({fromRevisionId, toRevisionId}),
    [getEditChanges, fromRevisionId, toRevisionId],
  )
  return useObservable(changes$, INITIAL_CHANGES)
}
