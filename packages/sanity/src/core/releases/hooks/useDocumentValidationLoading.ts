import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'

import {type DocumentInRelease} from '../tool/detail/useBundleDocuments'
import {isGoingToUnpublish} from '../util/isGoingToUnpublish'

export interface ValidationLoadingState {
  validatedCount: number
  isValidating: boolean
}

export function useDocumentValidationLoading(
  documents: DocumentInRelease[],
): ValidationLoadingState {
  const validationLoadingObservable = useMemo(() => {
    if (!documents.length) {
      return of({
        validatedCount: 0,
        isValidating: false,
      })
    }

    // Create observables for each document's validation status
    const documentValidationObservables = documents.map((doc) => {
      // For documents that are going to be unpublished, they don't need validation
      if (isGoingToUnpublish(doc.document)) {
        return of({isValidating: false})
      }

      // Everything else can use the isValidating value from the document
      return of({
        isValidating: doc.validation.isValidating,
      })
    })

    return combineLatest(documentValidationObservables).pipe(
      map((validationStates) => {
        const validatedCount = validationStates.filter((state) => !state.isValidating).length
        const isValidating = validationStates.some((state) => state.isValidating)

        return {
          validatedCount,
          isValidating,
        }
      }),
      startWith({
        validatedCount: 0,
        isValidating: true,
      }),
    )
  }, [documents])

  return useObservable(validationLoadingObservable, {
    validatedCount: 0,
    isValidating: true,
  })
}
