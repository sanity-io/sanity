import {useEffect, useState} from 'react'
import {type DocumentInRelease} from '../detail/useBundleDocuments'

interface ValidationTiming {
  validationStartTime: number | null
  validationEndTime: number | null
  validationDuration: number | null
  isTrackingValidation: boolean
}

export function useValidationTiming(documents: DocumentInRelease[]): ValidationTiming {
  const [validationStartTime, setValidationStartTime] = useState<number | null>(null)
  const [validationEndTime, setValidationEndTime] = useState<number | null>(null)
  const [validationDuration, setValidationDuration] = useState<number | null>(null)
  const [isTrackingValidation, setIsTrackingValidation] = useState(false)

  // Track validation timing
  useEffect(() => {
    const totalDocuments = documents.length
    const validatingDocuments = documents.filter((doc) => doc.validation.isValidating)
    const validatedDocuments = documents.filter((doc) => !doc.validation.isValidating)

    const hasValidatingDocuments = validatingDocuments.length > 0
    const allDocumentsValidated = validatedDocuments.length === totalDocuments && totalDocuments > 0

    // Start tracking when first document starts validating
    if (hasValidatingDocuments && !isTrackingValidation) {
      setValidationStartTime(Date.now())
      setIsTrackingValidation(true)
      setValidationEndTime(null)
      setValidationDuration(null)
    }

    // End tracking when all documents are validated
    if (allDocumentsValidated && isTrackingValidation) {
      const endTime = Date.now()
      const duration = endTime - (validationStartTime || endTime)
      setValidationEndTime(endTime)
      setValidationDuration(duration)
      setIsTrackingValidation(false)
    }
  }, [documents, isTrackingValidation, validationStartTime])

  // Reset timing when documents change
  useEffect(() => {
    if (documents.length === 0) {
      setValidationStartTime(null)
      setValidationEndTime(null)
      setValidationDuration(null)
      setIsTrackingValidation(false)
    }
  }, [documents.length])

  return {
    validationStartTime,
    validationEndTime,
    validationDuration,
    isTrackingValidation,
  }
}
