import {type ReleaseDocument} from '@sanity/client'
import {useCallback, useEffect, useRef, useState} from 'react'

type ReleaseFormData = {
  title: string
  description: string
}

interface UseFocusAwareFormStateOptions<T> {
  /** The external value from props/server */
  externalValue: T
  id: string
  extractData: (value: T) => ReleaseFormData
}

/**
 * Hook for managing release form state that syncs with server data while respecting per-field focus.
 *
 * This prevents server updates from overriding user input during typing.
 * Local state syncs with server data on a per-field basis only when the field is not focused.
 *
 * @internal
 */
export function useFocusAwareFormState<T>({
  externalValue,
  id,
  extractData,
}: UseFocusAwareFormStateOptions<T>) {
  const [localData, setLocalData] = useState(() => extractData(externalValue))
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const previousIdRef = useRef(id)

  useEffect(() => {
    const incomingFormData = extractData(externalValue)
    // New releases don't have _createdAt and should always sync to support local storage
    const isPersistedRelease = Boolean('_createdAt' in externalValue && externalValue._createdAt)

    if (previousIdRef.current !== id) {
      previousIdRef.current = id
      setLocalData(incomingFormData)
      setFocusedField(null)
    } else if (isPersistedRelease) {
      setLocalData((currentFormData) => {
        const formFieldNames = Object.keys(incomingFormData) as Array<keyof ReleaseFormData>
        const unfocusedFieldUpdates = formFieldNames
          .filter((field) => field !== focusedField)
          .reduce<Partial<ReleaseFormData>>((fieldUpdates, field) => {
            fieldUpdates[field] = incomingFormData[field]
            return fieldUpdates
          }, {})

        return {...currentFormData, ...unfocusedFieldUpdates}
      })
    } else {
      setLocalData(incomingFormData)
    }
  }, [externalValue, id, extractData, focusedField])

  const createFocusHandler = useCallback(
    (fieldName: string) => () => setFocusedField(fieldName),
    [],
  )

  const handleBlur = useCallback(() => setFocusedField(null), [])

  const updateLocalData = useCallback((formDataUpdates: Partial<ReleaseFormData>) => {
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
