import {useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

const eventBus = window.__webpack_hot_middleware_eventbus__
const events = eventBus ? eventBus.eventTypes : {}

const CONNECTION_TOAST_ID = 'dev-server-status'
const BUNDLE_EVENT_TOAST_ID = 'dev-server-bundle-event'

const STATE_CONNECTING = 0
const STATE_OPEN = 1
const STATE_CLOSED = 2

function DevServerStatus() {
  const [connectionState, setConnectionState] = useState(STATE_CONNECTING)
  const [hasHadConnection, setHasHadConnection] = useState(false)
  const {push} = useToast()

  const handleBuilding = useCallback(() => {
    push({
      closable: true,
      id: BUNDLE_EVENT_TOAST_ID,
      status: 'info',
      title: 'Rebuilding bundle…',
    })
  }, [push])

  const handleBuilt = useCallback(() => {
    push({
      closable: true,
      id: BUNDLE_EVENT_TOAST_ID,
      status: 'success',
      title: 'Rebuilt bundle',
    })
  }, [push])

  const handleConnecting = useCallback(() => {
    if (connectionState === STATE_CONNECTING) return
    setConnectionState(STATE_CONNECTING)
  }, [connectionState])

  const handleConnected = useCallback(() => {
    if (connectionState === STATE_OPEN) return
    setConnectionState(STATE_OPEN)
    push({
      closable: true,
      id: CONNECTION_TOAST_ID,
      status: 'success',
      title: 'Connected to dev server',
    })
  }, [connectionState, push])

  const handleDisconnected = useCallback(() => {
    if (connectionState === STATE_CLOSED) return
    setConnectionState(STATE_CLOSED)
    push({
      closable: true,
      id: CONNECTION_TOAST_ID,
      status: 'warning',
      title: 'Disconnected from dev server',
      timeout: Infinity,
    })
  }, [connectionState, push])

  const handleEvent = useCallback(
    (evt) => {
      if (evt.type === events.EVENT_BUILT) {
        handleBuilt(evt)
      }

      if (evt.type === events.EVENT_BUILDING) {
        handleBuilding(evt)
      }

      if (evt.type === events.EVENT_CONNECTING) {
        handleConnecting(evt)
      }

      if (evt.type === events.EVENT_CONNECTED) {
        handleConnected(evt)
      }

      if (evt.type === events.EVENT_DISCONNECTED) {
        handleDisconnected(evt)
      }
    },
    [handleBuilding, handleBuilt, handleConnected, handleConnecting, handleDisconnected]
  )

  // Handle reconnected
  useEffect(() => {
    if (connectionState === STATE_OPEN) {
      if (hasHadConnection) {
        // @todo
        // We reconnected after being disconnected.
        // Hot-reloading won't be applied automatically.
        // We should consider showing a message telling the user to reload,
        // or just programatically reload the page:
        // window.location.reload()
      } else {
        setHasHadConnection(true)
      }
    }
  }, [connectionState, hasHadConnection])

  // Subscribe to events
  useEffect(() => {
    if (!__DEV__ || !eventBus) return undefined
    return eventBus.subscribe(handleEvent)
  }, [handleEvent])

  return null
}

export default DevServerStatus
