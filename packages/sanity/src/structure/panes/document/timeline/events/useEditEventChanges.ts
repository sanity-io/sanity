import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type EditDocumentVersionEvent, useEvents} from 'sanity'

const INITIAL_CHANGES = {loading: true, diff: null, error: null}

/**
 * What an edit event changed: the changes of its transactions, from the oldest to the newest (one
 * for a listed transaction).
 */
export function useEditEventChanges(event: EditDocumentVersionEvent) {
  const {getEditChanges} = useEvents()
  const toRevisionId = event.revisionId
  const fromRevisionId = event.transactions.at(-1)?.revisionId ?? toRevisionId
  const changes$ = useMemo(
    () => getEditChanges({fromRevisionId, toRevisionId}),
    [getEditChanges, fromRevisionId, toRevisionId],
  )
  return useObservable(changes$, INITIAL_CHANGES)
}
