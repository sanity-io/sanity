import {type ComponentType} from 'react'

import {usePathSyncChannel} from '../hooks/usePathSyncChannel'
import {type PathSyncChannelProps} from '../types/pathSyncChannel'

export const PathSyncChannelSubscriber: ComponentType<PathSyncChannelProps> = (props) => {
  usePathSyncChannel(props)
  return undefined
}
