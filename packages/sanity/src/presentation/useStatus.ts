import {type StatusEvent} from '@sanity/comlink'
import {useCallback, useMemo, useState} from 'react'

import {type ConnectionStatus} from './types'

/**
 * The tracked status of a single comlink connection on a channel
 * @internal
 */
export interface ChannelConnectionStatus {
  status: ConnectionStatus
  hasConnected: boolean
}

/**
 * Per-connection statuses for a comlink channel, keyed by connection id
 * @internal
 */
export type ChannelStatusMap = ReadonlyMap<string, ChannelConnectionStatus>

/**
 * Reduces an incoming comlink status event into a new per-connection status map.
 * Disconnected connections are removed, and a `hasConnected` flag is tracked per
 * connection so reconnects can be told apart from initial connects.
 * @internal
 */
export function reduceStatusMap(prev: ChannelStatusMap, event: StatusEvent): ChannelStatusMap {
  const next = new Map(prev)
  if (event.status === 'disconnected') {
    // Remove the channel from the map if a disconnect event is received
    next.delete(event.connection)
  } else {
    // Update the status and connection flag for the channel
    const hasConnected = next.get(event.connection)?.hasConnected || event.status === 'connected'
    const status = event.status === 'handshaking' ? 'connecting' : event.status
    next.set(event.connection, {status, hasConnected})
  }
  return next
}

/**
 * Aggregates per-connection statuses into a single connection status:
 * - 'connected': if any connection is connected
 * - 'connecting': if a first connection is being established
 * - 'reconnecting': if a reconnection is in progress
 * - 'idle': if no connections have been made yet
 * @internal
 */
export function aggregateConnectionStatus(statusMap: ChannelStatusMap): ConnectionStatus {
  const values = Array.from(statusMap.values())
  // If any channel is connected, return the `connected` status
  if (values.some(({status}) => status === 'connected')) {
    return 'connected'
  }
  // If the initial connection is being established, return `connecting` status
  const handshaking = values.filter(({status}) => status === 'connecting')
  if (handshaking.length > 0) {
    return handshaking.some(({hasConnected}) => !hasConnected) ? 'connecting' : 'reconnecting'
  }
  // If nothing has happened yet, return `idle` status
  return 'idle'
}

/**
 * A hook that manages and returns the connection status of multiple channels
 *
 * returns an array containing the
 * current status and a function to update the status based on incoming events
 *
 * The function to update the status takes a `StatusEvent` object which includes
 * the channel and the status
 */
export function useStatus(): [ConnectionStatus, (event: StatusEvent) => void] {
  // State to keep track of the status of each channel
  const [statusMap, setStatusMap] = useState<ChannelStatusMap>(() => new Map())

  // Memoized computation of the overall status based on the status of individual channels
  const memoStatus = useMemo(() => aggregateConnectionStatus(statusMap), [statusMap])

  // Callback to update the status map based on the received event
  const setStatusFromEvent = useCallback((event: StatusEvent) => {
    setStatusMap((prev) => reduceStatusMap(prev, event))
  }, [])

  // Return the overall status and the function to update the status
  return [memoStatus, setStatusFromEvent]
}
