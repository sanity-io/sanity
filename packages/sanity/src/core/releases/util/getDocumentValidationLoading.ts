import {type DocumentInRelease} from '../tool/detail/useBundleDocuments'
import {isGoingToUnpublish} from './isGoingToUnpublish'

/**
 * This function is used to get a cleaner and quicker validation loading state and error status for a list of documents
 * @param documents - The list of documents to get the validation loading state for
 * @returns
 */
export const getDocumentValidationLoading = (documents: DocumentInRelease[]) => {
  let hasError = false
  let isValidating = false
  let validatedCount = 0
  documents.forEach((doc) => {
    if (isGoingToUnpublish(doc.document)) {
      validatedCount += 1
    } else {
      const isValidated = !doc.validation.isValidating
      hasError = hasError || doc.validation.hasError
      isValidating = isValidating || doc.validation.isValidating
      if (isValidated) {
        validatedCount += 1
      }
    }
  })
  return {
    hasError,
    isValidating,
    validatedCount,
  }
}
