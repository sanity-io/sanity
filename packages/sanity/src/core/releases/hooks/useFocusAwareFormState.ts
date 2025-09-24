import {useCallback, useEffect, useRef, useState} from 'react'

interface UseFocusAwareFormStateOptions<T, TFormData extends Record<string, unknown>> {
  /** The external value from props/server */
  externalValue: T
  id: string
  extractData: (value: T) => TFormData
}

/**
 * Hook for managing form state that syncs with external data while respecting per-field focus.
 *
 * This prevents the issue where server updates override user input during typing.
 * The local state will sync with external data on a per-field basis when the field is not focused.
 *
 * @internal
 */
export function useFocusAwareFormState<T, TFormData extends Record<string, unknown>>({
  externalValue,
  id,
  extractData,
}: UseFocusAwareFormStateOptions<T, TFormData>) {
  const [localData, setLocalData] = useState(() => extractData(externalValue))
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const idRef = useRef(id)

  // Sync external data to local state when:
  // 1. ID changes (navigating to different item) - always sync all fields
  // 2. Same ID - only sync unfocused fields (allow server updates for unfocused fields)
  useEffect(() => {
    const newData = extractData(externalValue)

    if (idRef.current === id) {
      setLocalData((prev) => {
        const updated = {...prev} as Record<string, unknown>
        Object.keys(newData).forEach((field) => {
          if (focusedField !== field) {
            updated[field] = (newData as Record<string, unknown>)[field]
          }
        })
        return updated as TFormData
      })
    } else {
      idRef.current = id
      setLocalData(newData)
      setFocusedField(null)
    }
  }, [externalValue, id, extractData, focusedField])

  const createFocusHandler = useCallback(
    (fieldName: string) => () => setFocusedField(fieldName),
    [],
  )

  const handleBlur = useCallback(() => setFocusedField(null), [])

  const updateLocalData = useCallback((updates: Partial<TFormData>) => {
    setLocalData((prev) => ({...prev, ...updates}))
  }, [])

  return {
    localData,
    updateLocalData,
    createFocusHandler,
    handleBlur,
    focusedField,
  }
}
