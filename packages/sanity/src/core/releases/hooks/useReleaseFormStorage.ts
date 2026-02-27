import {type ReleaseType} from '@sanity/client'
import {useCallback} from 'react'

const RELEASE_FORM_STORAGE_KEY = 'studio.release-form.recovery'

interface ReleaseFormDraft {
  title?: string
  description?: string
  releaseType?: ReleaseType
  intendedPublishAt?: string
}

/**
 * This hook is used to store the release form data in localStorage.
 * The main use case is when a user accidentally closes the dialog for a release before it is created .
 *
 * @returns an object with the following methods:
 * - getStoredReleaseData: a function that returns the stored release form data
 * - saveReleaseDataToStorage: a function that saves the release form data to localStorage
 * - clearReleaseDataFromStorage: a function that clears the release form data from localStorage
 */
export function useReleaseFormStorage() {
  const getStoredReleaseData = useCallback((): ReleaseFormDraft | undefined => {
    const stored = localStorage.getItem(RELEASE_FORM_STORAGE_KEY)
    return stored ? JSON.parse(stored) : undefined
  }, [])

  const saveReleaseDataToStorage = useCallback((data: ReleaseFormDraft) => {
    localStorage.setItem(RELEASE_FORM_STORAGE_KEY, JSON.stringify(data))
  }, [])

  const clearReleaseDataFromStorage = useCallback(() => {
    localStorage.removeItem(RELEASE_FORM_STORAGE_KEY)
  }, [])

  return {getStoredReleaseData, saveReleaseDataToStorage, clearReleaseDataFromStorage}
}
