import {type PathSyncChannel, type PathSyncState} from '../types/pathSyncChannel'
import {useMemo} from 'react'
import {Subject} from 'rxjs'

/**
 * @internal
 */
export function useCreatePathSyncChannel(): PathSyncChannel {
  return useMemo(() => new Subject<PathSyncState>(), [])
}
