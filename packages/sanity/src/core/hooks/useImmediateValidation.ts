import {type SanityDocument} from '@sanity/types'
import {useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'
import {asyncScheduler, type Observable, of} from 'rxjs'
import {map, startWith, subscribeOn} from 'rxjs/operators'

import {useDocumentPreviewStore} from '../store/datastores'
import {useSource} from '../studio/source'
import {
  isSameDocumentContent,
  validateDocumentImmediately,
  type ValidationStatus,
} from '../validation'

type Progress = Pick<ValidationStatus, 'isValidating' | 'validation'>

const RUNNING: Progress = {isValidating: true, validation: []}

/**
 * Validates `document` right away while `enabled`, without the idle-callback pacing of the
 * document store's validation (see `useValidationStatus`): the run uses the main thread as soon
 * as it can and blocks it for the duration of the synchronous checks. For the moment a user is
 * waiting on the result, such as a publish that has been waiting on validation for a while.
 *
 * Returns `null` while not enabled, otherwise the status of the run: validating until it has the
 * markers of the document's current content, with `revision` always the document's current
 * `_rev`. Like the store's validation, the run is kept when a new revision brings the same
 * content (the server acknowledging a local edit) and restarted when the content changes. It
 * stops as soon as the hook is disabled.
 *
 * @internal
 */
export function useImmediateValidation(
  document: SanityDocument | null | undefined,
  requirePublishedReferences: boolean,
  enabled: boolean,
): ValidationStatus | null {
  // oxlint-disable-next-line no-deprecated -- deprecated for studio code only; core hooks read the source this way
  const {getClient, schema, i18n, currentUser} = useSource()
  const {unstable_observeDocumentPairAvailability: observeDocumentPairAvailability} =
    useDocumentPreviewStore()

  // The snapshot being validated: replaced only when the content changes, so that a new `_rev`
  // for content that is being validated already does not start the run over.
  const [content, setContent] = useState(document)
  if (!isSameDocumentContent(content, document)) {
    setContent(document)
  }

  const progress$ = useMemo((): Observable<Progress | null> => {
    if (!enabled || !content) return of(null)
    return validateDocumentImmediately(
      {getClient, observeDocumentPairAvailability, schema, i18n, currentUser},
      content,
      requirePublishedReferences,
    ).pipe(
      map((validation): Progress => ({isValidating: false, validation})),
      // The run blocks the main thread, so it starts in a task of its own: whatever the enabling
      // render committed (e.g. a dialog saying the document is being validated) gets to paint
      // first. `startWith` still reports the run as under way right away.
      subscribeOn(asyncScheduler),
      startWith(RUNNING),
    )
  }, [
    content,
    currentUser,
    enabled,
    getClient,
    i18n,
    observeDocumentPairAvailability,
    requirePublishedReferences,
    schema,
  ])
  const progress = useSyncObservable(progress$, null)

  const revision = document?._rev
  return useMemo(() => (progress ? {...progress, revision} : null), [progress, revision])
}
