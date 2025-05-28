import {useMemo} from 'react'
import {Subject} from 'rxjs'

import {type PathSyncChannel, type PathSyncState} from '../types/pathSyncChannel'

/**
 * @internal
 */
export function useCreatePathSyncChannel(): PathSyncChannel {
  return useMemo(() => new Subject<PathSyncState>(), [])
}
