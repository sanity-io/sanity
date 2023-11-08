import {useEffect, useState} from 'react'

const onboardingDismissedKey = 'sanityStudio:desk:renameDismissed'

const supportsLocalStorage = (() => {
  if (typeof localStorage === 'undefined') {
    return false
  }

  const mod = 'lsCheck'
  try {
    localStorage.setItem(mod, mod)
    localStorage.removeItem(mod)
    return true
  } catch (err) {
    return false
  }
})()

/**
 * Hook that tells whether or not to show the onboarding that tells the user about the rename of
 * the desk tool (now "structure"). Also includes a function that can be used to dismiss the
 * onboarding and store that state so it does not show on subsequent loads.
 *
 * @internal
 */
export function useDeskRenameOnboarding(): {
  showOnboarding: boolean
  dismissOnboarding: () => void
} {
  const [showOnboarding, setShowOnboarding] = useState(() => !isDeskRenameOnboardingDismissed())

  useEffect(() => {
    if (typeof window === 'undefined' || !supportsLocalStorage) {
      return () => {
        /* intentional noop */
      }
    }

    function onStorageEvent(event: StorageEvent) {
      if (event.newValue !== event.oldValue && event.key === onboardingDismissedKey) {
        setShowOnboarding(event.newValue !== '1')
      }
    }

    window.addEventListener('storage', onStorageEvent)
    return () => {
      window.removeEventListener('storage', onStorageEvent)
    }
  }, [])

  return {
    showOnboarding,
    dismissOnboarding: dismissDeskRenameOnboarding,
  }
}

/**
 * Dismisses (hides, and stores that state) the onboarding that tells the user about the rename of
 * the desk tool (now "structure").
 *
 * @internal
 */
function dismissDeskRenameOnboarding(): void {
  if (!supportsLocalStorage) {
    return
  }

  localStorage.setItem(onboardingDismissedKey, '1')
}

function isDeskRenameOnboardingDismissed(): boolean {
  // @todo should we encode some end-date for when to stop showing the prompt?

  if (!supportsLocalStorage) {
    // We shouldn't show the onboarding on every load if the user can't even dismiss it
    return true
  }

  const value = localStorage.getItem(onboardingDismissedKey)
  return value === '1'
}
