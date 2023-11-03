import React, {useCallback, useMemo, useState} from 'react'
import {CommentsOnboardingContext} from './CommentsOnboardingContext'
import {CommentsOnboardingContextValue} from './types'

const VERSION = 1
const LOCAL_STORAGE_KEY = `sanityStudio:comments:inspector:onboarding:dismissed:v${VERSION}`

const setLocalStorage = (value: boolean) => {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value))
  } catch (_) {
    // Fail silently
  }
}

const getLocalStorage = (): boolean => {
  try {
    const value = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return value ? JSON.parse(value) : false
  } catch (_) {
    return false
  }
}

interface CommentsOnboardingProviderProps {
  children: React.ReactNode
}

export function CommentsOnboardingProvider(props: CommentsOnboardingProviderProps) {
  const {children} = props
  const [dismissed, setDismissed] = useState<boolean>(getLocalStorage())

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    setLocalStorage(true)
  }, [setDismissed])

  const ctxValue = useMemo(
    (): CommentsOnboardingContextValue => ({
      setDismissed: handleDismiss,
      isDismissed: dismissed,
    }),
    [handleDismiss, dismissed],
  )

  return (
    <CommentsOnboardingContext.Provider value={ctxValue}>
      {children}
    </CommentsOnboardingContext.Provider>
  )
}
