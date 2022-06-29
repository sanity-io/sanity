import {useState, useCallback, useEffect} from 'react'

type NetworkStatus = 'online' | 'offline'

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>('online')

  const handleOnline = useCallback(() => {
    setStatus('online')
  }, [])

  const handleOffline = useCallback(() => {
    setStatus('offline')
  }, [])

  useEffect(() => {
    if (typeof window.navigator.onLine !== 'undefined') {
      const online = window.navigator.onLine

      setStatus(online ? 'online' : 'offline')
    }
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return status
}
