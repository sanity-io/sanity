import {useTelemetry} from '@sanity/telemetry/react'
import {type AssetSourceComponentAction} from '@sanity/types'
import {useCallback, useRef} from 'react'

import {
  MediaLibraryAssetSourceResolved,
  type MediaLibraryAssetSourceResolvedInfo,
} from '../__telemetry__/mediaLibraryAssetSource.telemetry'

/**
 * Returns a function that logs {@link MediaLibraryAssetSourceResolved} the
 * first time it is called, so the event is sent once per opened asset source
 * even if the federated view later fails over to the iframe.
 *
 * @internal
 */
export function useReportAssetSourceResolved(
  action: AssetSourceComponentAction,
): (info: Omit<MediaLibraryAssetSourceResolvedInfo, 'action'>) => void {
  const telemetry = useTelemetry()
  const reportedRef = useRef(false)
  // The action an open started with, not the one it was switched to later.
  const actionRef = useRef(action)

  return useCallback(
    (info) => {
      if (reportedRef.current) return
      reportedRef.current = true
      telemetry.log(MediaLibraryAssetSourceResolved, {...info, action: actionRef.current})
    },
    [telemetry],
  )
}
