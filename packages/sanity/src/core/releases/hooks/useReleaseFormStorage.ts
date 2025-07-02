import {type ReleaseType} from '@sanity/client'
import {useCallback} from 'react'

const RELEASE_FORM_STORAGE_KEY = 'studio.release-form.recovery'

interface ReleaseFormDraft {
  title?: string
  description?: string
  releaseType?: ReleaseType
  intendedPublishAt?: string
}

export function useReleaseFormStorage() {
  const getStoredReleaseData = useCallback((): ReleaseFormDraft => {
    const stored = localStorage.getItem(RELEASE_FORM_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  }, [])

  const saveReleaseDataToStorage = useCallback((data: ReleaseFormDraft) => {
    localStorage.setItem(RELEASE_FORM_STORAGE_KEY, JSON.stringify(data))
  }, [])

  const clearReleaseDataFromStorage = useCallback(() => {
    localStorage.removeItem(RELEASE_FORM_STORAGE_KEY)
  }, [])

  return {getStoredReleaseData, saveReleaseDataToStorage, clearReleaseDataFromStorage}
}
