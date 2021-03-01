import {useSyncState, useConnectionState} from '@sanity/react-hooks'
import CheckIcon from 'part:@sanity/base/check-icon'
import SyncIcon from 'part:@sanity/base/sync-icon'
import React from 'react'

import styles from './syncState.css'

interface SyncStateProps {
  id: string
  type: string
}

export function SyncState(props: SyncStateProps) {
  const {id, type} = props
  const {isSyncing} = useSyncState(id)
  const connectionState = useConnectionState(id, type)
  const isConnected = connectionState === 'connected'
  const icon = isSyncing || !isConnected ? <SyncIcon /> : <CheckIcon />

  // eslint-disable-next-line no-nested-ternary
  const className = isSyncing
    ? styles.isSyncing
    : isConnected
    ? styles.statusIcon
    : styles.isDisconnected

  return <span className={className}>{icon}</span>
}
