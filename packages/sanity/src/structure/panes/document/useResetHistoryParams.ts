import {useEffect, useRef} from 'react'
import {usePerspective} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from './constants'

/**
 * This hooks takes care of resetting the history related params when the perspective changes.
 * It needs to be placed in a stable component, like the `DocumentPane`, which won't be unmounted when the perspective changes.
 */
export function useResetHistoryParams() {
  const {params = EMPTY_PARAMS, setParams} = usePaneRouter()

  const {selectedPerspectiveName} = usePerspective()
  const isMounted = useRef(false)

  const updateHistoryParams = useEffectEvent((_perspective?: string) => {
    // Check if any of the history related params are set, and reset them, don't unnecessarily update the params
    const PARAMS_TO_UPDATE = ['since', 'historyVersion', 'rev', 'preserveRev']
    const shouldUpdateParams = PARAMS_TO_UPDATE.some((param) => params[param])
    if (!shouldUpdateParams) return

    setParams({
      ...params,
      // Reset the history related params when the perspective changes, as they don't make sense
      // in the context of the new perspective - preserveRev is used when setting draft revision.
      rev: params.preserveRev === 'true' ? params.rev : undefined,
      preserveRev: undefined,
      since: undefined,
      historyVersion: undefined,
    })
  })
  useEffect(() => {
    // Skip the first run to avoid resetting the params on initial load
    if (isMounted.current) {
      updateHistoryParams(selectedPerspectiveName)
    }
  }, [selectedPerspectiveName])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])
}
