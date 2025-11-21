import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  DeploymentNotificationContext,
  type DeploymentNotificationContextValue,
} from 'sanity/_singletons'

import {fetchDeploymentEtag} from './fetchDeploymentEtag'
import {shouldCheckForDeployment} from './shouldCheckForDeployment'

const POLL_INTERVAL_MS = 30 * 1000 // check every 30 seconds
const CHECK_THROTTLE_TIME_MS = 5 * 1000 // prevent checking more often than every 5 seconds

interface DeploymentNotificationProviderProps {
  children: ReactNode
}

/**
 * Provider that polls for deployment changes by checking etag headers
 * Only active on *.sanity.studio or *.studio.sanity.work domains
 * @beta
 */
export function DeploymentNotificationProvider({
  children,
}: DeploymentNotificationProviderProps): ReactNode {
  const [initialEtag, setInitialEtag] = useState<string | null>(null)
  const [currentEtag, setCurrentEtag] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)
  const lastCheckTimeRef = useRef<number>(0)
  const isEnabled = useMemo(() => shouldCheckForDeployment(), [])

  const checkForDeployment = useCallback(async () => {
    if (!isEnabled) {
      return
    }

    const now = Date.now()
    const timeSinceLastCheck = now - lastCheckTimeRef.current

    // Throttle checks to prevent excessive requests
    if (timeSinceLastCheck < CHECK_THROTTLE_TIME_MS) {
      return
    }

    lastCheckTimeRef.current = now
    setIsChecking(true)

    fetchDeploymentEtag()
      .then((etag) => {
        if (!etag) {
          return
        }
        if (!initialEtag) {
          setInitialEtag(etag)
        }
        setCurrentEtag(etag)
      })
      .catch(() => {
        /* silently ignore errors */
      })
      .finally(() => {
        setIsChecking(false)
        setLastCheckedAt(Date.now())
      })
  }, [isEnabled, initialEtag])

  // Initial check and setup polling interval
  useEffect(() => {
    if (!isEnabled) {
      return undefined
    }

    // Do initial check
    void checkForDeployment()

    // Set up polling
    const intervalId = setInterval(() => void checkForDeployment(), POLL_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [checkForDeployment, isEnabled])

  const hasNewDeployment = useMemo(() => {
    if (!initialEtag || !currentEtag) {
      return false
    }
    return initialEtag !== currentEtag
  }, [initialEtag, currentEtag])

  const contextValue: DeploymentNotificationContextValue = useMemo(
    () => ({
      initialEtag,
      currentEtag,
      hasNewDeployment,
      isChecking,
      lastCheckedAt,
      checkForDeployment,
    }),
    [initialEtag, currentEtag, hasNewDeployment, isChecking, lastCheckedAt, checkForDeployment],
  )

  return (
    <DeploymentNotificationContext.Provider value={contextValue}>
      {children}
    </DeploymentNotificationContext.Provider>
  )
}
