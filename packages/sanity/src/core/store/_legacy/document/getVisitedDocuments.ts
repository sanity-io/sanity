import {type SanityDocument} from '@sanity/types'
import {type Observable, ReplaySubject, Subject} from 'rxjs'
import {map, scan, share, startWith, switchMap} from 'rxjs/operators'

import {type DocumentPreviewStore} from '../../../preview'
import {getDraftId, getPublishedId} from '../../../util'

const MAX_OBSERVED_DOCUMENTS = 5

/**
 * Keeps a listener of the documents the user visited through the form.
 * Allowing us to provide a quick way to navigate back to the last visited documents.
 */
export function getVisitedDocuments({
  observeDocuments,
}: {
  observeDocuments: DocumentPreviewStore['unstable_observeDocuments']
}): {
  add: (id: string) => void
  observed$: Observable<(SanityDocument | undefined)[]>
} {
  const observedDocumentsSubject = new Subject<string>()

  const observed$ = observedDocumentsSubject.pipe(
    scan((prev: string[], nextDoc: string) => {
      const nextDocs = [...prev]
      if (nextDocs.includes(nextDoc)) {
        // Doc is already observed, remove it from the list and push it to the end
        nextDocs.splice(nextDocs.indexOf(nextDoc), 1)
        nextDocs.push(nextDoc)
      } else {
        // Doc is not observed, push it to the end
        nextDocs.push(nextDoc)
      }
      // Remove the oldest doc if we're observing more than the max allowed
      if (nextDocs.length > MAX_OBSERVED_DOCUMENTS) {
        nextDocs.shift()
      }
      return nextDocs
    }, []),
    map((ids) => ids.flatMap((id) => [getPublishedId(id), getDraftId(id)])),
    switchMap((ids) => {
      return observeDocuments(ids)
    }),
    startWith([]),
    share({
      connector: () => new ReplaySubject(1),
      resetOnError: false,
      resetOnComplete: false,
      resetOnRefCountZero: false,
    }),
  )

  return {
    add: (id: string) => {
      observedDocumentsSubject.next(id)
    },
    observed$,
  }
}
