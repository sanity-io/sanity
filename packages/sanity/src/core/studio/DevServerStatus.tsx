import {useToast} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'

console.log('LOADED DEV SERVER STATUS')

export const useDetectDevServerDisconnect = () => {
  const [serverStopped, setServerStopped] = useState(false)
  const serverIsReadyRef = useRef(false)

  useEffect(() => {
    const url = `ws://${window.location.hostname}:${window.location.port}/`
    const ws = new WebSocket(url, 'vite-hmr')

    ws.onclose = () => {
      if (!serverIsReadyRef.current) return
      setServerStopped(true)
    }
    ws.onopen = () => {
      if (!serverIsReadyRef.current) {
        serverIsReadyRef.current = true
      }

      setServerStopped(false)
    }

    return () => ws.close()
  }, [])

  return serverStopped
}

const DevServerStatusToast = () => {
  const serverStopped = useDetectDevServerDisconnect()
  const toast = useToast()

  useEffect(() => {
    if (serverStopped) {
      toast.push({
        id: 'dev-server-stopped',
        duration: 60000,
        closable: true,
        status: 'error',
        title: 'Dev server stopped',
        description:
          'The development server has stopped. You may need to restart it to continue working.',
      })
    }
  }, [serverStopped, toast])

  return null
}

export class DevServerStopError extends Error {
  isDevServerError: boolean

  constructor() {
    super('DevServerStopError')
    this.name = 'DevServerStopError'
    this.isDevServerError = true
  }
}

export const DevServerStatusThrower = () => {
  const serverStopped = useDetectDevServerDisconnect()

  if (serverStopped) {
    throw new DevServerStopError()
  }

  return null
}

export default DevServerStatusToast
