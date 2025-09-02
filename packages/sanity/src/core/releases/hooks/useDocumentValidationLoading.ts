import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'

import {type DocumentInRelease} from '../tool/detail/useBundleDocuments'
import {isGoingToUnpublish} from '../util/isGoingToUnpublish'

export interface ValidationLoadingState {
  validatedCount: number
  isValidating: boolean
  hasError: boolean
}

export function useDocumentValidationLoading(
  documents: DocumentInRelease[],
): ValidationLoadingState {
  const validationLoadingObservable = useMemo(() => {
    if (!documents.length) {
      return of({
        validatedCount: 0,
        isValidating: false,
        hasError: false,
      })
    }

    // Create observables for each document's validation status
    const documentValidationObservables = documents.map((doc) => {
      // For documents that are going to be unpublished, they don't need validation
      if (isGoingToUnpublish(doc.document)) {
        return of({isValidating: false, hasError: false})
      }

      // Everything else can use the isValidating value from the document
      return of({
        isValidating: doc.validation.isValidating,
        hasError: doc.validation.hasError,
      })
    })

    return combineLatest(documentValidationObservables).pipe(
      map((validationStates) => {
        const validatedCount = validationStates.filter((state) => !state.isValidating).length
        const isValidating = validationStates.some((state) => state.isValidating)
        const hasError = validationStates.some((state) => state.hasError)

        return {
          validatedCount,
          isValidating,
          hasError,
        }
      }),
      startWith({
        validatedCount: 0,
        isValidating: true,
        hasError: false,
      }),
    )
  }, [documents])

  return useObservable(validationLoadingObservable, {
    validatedCount: 0,
    isValidating: true,
    hasError: false,
  })
}
