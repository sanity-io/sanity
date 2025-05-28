import {type StatusEvent} from '@sanity/comlink'
import {useCallback, useMemo, useState} from 'react'

import {type ConnectionStatus} from './types'

/**
 * A hook that manages and returns the connection status of multiple channels
 *
 * returns an array containing the
 * current status and a function to update the status based on incoming events
 *
 * The status can be one of the following:
 * - 'connected': If any channel is connected
 * - 'connecting': If the first connection is being established
 * - 'reconnecting': If a reconnection is in progress
 * - 'idle': If no connections have been made yet
 *
 * The function to update the status takes a `StatusEvent` object which includes
 * the channel and the status
 */
export function useStatus(): [ConnectionStatus, (event: StatusEvent) => void] {
  // State to keep track of the status of each channel
  const [statusMap, setStatusMap] = useState(
    new Map<string, {status: ConnectionStatus; hasConnected: boolean}>(),
  )

  // Memoized computation of the overall status based on the status of individual channels
  const memoStatus = useMemo(() => {
    const values = Array.from(statusMap.values())
    // If any channel is connected, return the `connected` status
    if (values.find(({status}) => status === 'connected')) {
      return 'connected'
    }
    // If the initial connection is being established, return `connecting` status
    const handshaking = values.filter(({status}) => status === 'connecting')
    if (handshaking.length) {
      return handshaking.some(({hasConnected}) => !hasConnected) ? 'connecting' : 'reconnecting'
    }
    // If nothing has happened yet, return `idle` status
    return 'idle'
  }, [statusMap])

  // Callback to update the status map based on the received event
  const setStatusFromEvent = useCallback((event: StatusEvent) => {
    setStatusMap((prev) => {
      const next = new Map(prev)
      if (event.status === 'disconnected') {
        // Remove the channel from the map if a disconnect event is received
        next.delete(event.connection)
      } else {
        // Update the status and connection flag for the channel
        const hasConnected =
          next.get(event.connection)?.hasConnected || event.status === 'connected'
        const status = event.status === 'handshaking' ? 'connecting' : event.status
        next.set(event.connection, {status, hasConnected})
      }
      return next
    })
  }, [])

  // Return the overall status and the function to update the status
  return [memoStatus, setStatusFromEvent]
}
