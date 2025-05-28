import {type Path} from '@sanity/types'
import {type Subject} from 'rxjs'

/**
 * @internal
 */
export interface PathSyncState {
  path: Path
  source?: string
}

/**
 * @internal
 */
export type PathSyncChannel = Subject<PathSyncState>

/**
 * @internal
 */
export interface PathSyncChannelProps {
  syncChannel: PathSyncChannel
  id: string
}
