import {usePathSyncChannel} from '../hooks/usePathSyncChannel'
import {type PathSyncChannelProps} from '../types/pathSyncChannel'
import {type ComponentType} from 'react'

export const PathSyncChannelSubscriber: ComponentType<PathSyncChannelProps> = (props) => {
  usePathSyncChannel(props)
  return undefined
}
