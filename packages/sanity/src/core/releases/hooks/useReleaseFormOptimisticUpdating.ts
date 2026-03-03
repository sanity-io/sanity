import {type EditableReleaseDocument} from '@sanity/client'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {type ReleaseDescription} from '../types/releaseDescription'

type ReleaseFormFields = {
  title: string
  description: ReleaseDescription
}

interface UseReleaseFormOptimisticUpdatingOptions {
  /** The external value from props/server */
  externalValue: EditableReleaseDocument
  id: string
  extractData: (value: EditableReleaseDocument) => ReleaseFormFields
}

/**
 * Hook for managing release form state that syncs with server data while respecting per-field focus.
 *
 * This prevents server updates from overriding user input during typing.
 * Local state syncs with server data on a per-field basis only when the field is not focused.
 *
 * @internal
 */
export function useReleaseFormOptimisticUpdating({
  externalValue,
  id,
  extractData,
}: UseReleaseFormOptimisticUpdatingOptions) {
  const incomingFormData = useMemo(() => extractData(externalValue), [externalValue, extractData])
  const [localData, setLocalData] = useState(() => incomingFormData)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const previousIdRef = useRef(id)

  const updateUnfocusedFields = useCallback(
    (currentFormData: ReleaseFormFields) => ({
      ...currentFormData,
      ...Object.fromEntries(
        (Object.keys(incomingFormData) as Array<keyof ReleaseFormFields>)
          .filter((field) => field !== focusedField)
          .map((field) => [field, incomingFormData[field]]),
      ),
    }),
    [incomingFormData, focusedField],
  )

  useEffect(() => {
    // New releases don't have _createdAt and should always sync to support local storage
    const isEditingExistingRelease = Boolean(externalValue._createdAt)

    if (previousIdRef.current === id) {
      setLocalData(isEditingExistingRelease ? updateUnfocusedFields : incomingFormData)
    } else {
      previousIdRef.current = id
      setLocalData(incomingFormData)
      setFocusedField(null)
    }
  }, [incomingFormData, id, externalValue._createdAt, updateUnfocusedFields])

  const createFocusHandler = useCallback(
    (fieldName: string) => () => setFocusedField(fieldName),
    [],
  )

  const handleBlur = useCallback(() => setFocusedField(null), [])

  const updateLocalData = useCallback((formDataUpdates: Partial<ReleaseFormFields>) => {
    setLocalData((currentFormData) => ({...currentFormData, ...formDataUpdates}))
  }, [])

  return {
    localData,
    updateLocalData,
    createFocusHandler,
    handleBlur,
    focusedField,
  }
}
