import React, {useCallback, useMemo, useState} from 'react'
import {CommentsOnboardingContext} from './CommentsOnboardingContext'
import {CommentsOnboardingContextValue} from './types'

const VERSION = 1
const LOCAL_STORAGE_KEY = `sanity.comments.onboarding.dismissed.v${VERSION}`

const setLocalStorage = (value: boolean) => {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value))
}

const getLocalStorage = (): boolean => {
  const value = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  return value ? JSON.parse(value) : false
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
    () =>
      ({
        setDismissed: handleDismiss,
        isDismissed: dismissed,
      }) satisfies CommentsOnboardingContextValue,
    [handleDismiss, dismissed],
  )

  return (
    <CommentsOnboardingContext.Provider value={ctxValue}>
      {children}
    </CommentsOnboardingContext.Provider>
  )
}
